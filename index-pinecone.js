const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { pipeline } = require("@xenova/transformers");
require('dotenv').config();

const HF_API_KEY = process.env.HF_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_BASE_URL = process.env.PINECONE_BASE_URL;

async function obtenerEmbeddings(texto) {
    try {
        const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

        // Generar el embedding
        const tensorEmbeddings = await embedder(texto, { pooling: "mean", normalize: true });

        // Convertir Tensor a un arreglo de JavaScript
        let embeddingsArray = Array.from(tensorEmbeddings.data);
        console.log("Embedding generado (array plano):", embeddingsArray);
        console.log("Longitud del embedding:", embeddingsArray.length);

        // Comprobar si es necesario agregar padding para llegar a 1024 dimensiones
        if (embeddingsArray.length < 1024) {
            embeddingsArray = embeddingsArray.concat(Array(1024 - embeddingsArray.length).fill(0));
            console.log("Longitud del embedding con padding:", embeddingsArray.length);
        }

        // Confirmar que es un array de 1024 dimensiones
        if (embeddingsArray.length === 1024 && embeddingsArray.every(element => typeof element === "number")) {
            return embeddingsArray;
        } else {
            throw new Error(`No se pudo generar un array de 1024 dimensiones. Longitud actual: ${embeddingsArray.length}`);
        }
    } catch (error) {
        console.error("Error generando embedding:", error);
        return null;
    }
}

async function recuperarFrasesTierraMedia(consulta) {
    const vectorConsulta = await obtenerEmbeddings(consulta);

    if (!vectorConsulta || vectorConsulta.length !== 1024) {
        console.error("Formato de vector de consulta inválido o desajuste en las dimensiones.");
        return "";
    }

    try {
        const respuesta = await axios.post(
            `${PINECONE_BASE_URL}/query`,
            {
                vector: vectorConsulta,
                topK: 3,
                includeMetadata: true,
            },
            {
                headers: {
                    "Api-Key": PINECONE_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );

        return respuesta.data.matches.map(match => match.metadata.text).join(" ");
    } catch (error) {
        console.error("Error consultando Pinecone:", error.response ? error.response.data : error.message);
        return "";
    }
}

async function generarDocsTierraMedia(descripcionFuncion) {
    const prompt = `Como si fueras Gandalf, describe el propósito de la siguiente función de la tradición de la Tierra Media.\nFunción: ${descripcionFuncion}`;
    const respuesta = await axios.post(
        "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-125M",
        { inputs: prompt },
        { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return respuesta.data[0].generated_text;
}

function parsearCodigo(codigo) {
    const regexFuncion = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
    const funciones = [];
    let coincidencia;

    while ((coincidencia = regexFuncion.exec(codigo)) !== null) {
        const nombre = coincidencia[1];
        const parametros = coincidencia[2].split(",").map(param => param.trim());
        funciones.push({ nombre, parametros });
    }

    return funciones;
}

async function documentarArchivo(rutaArchivo) {
    const codigo = fs.readFileSync(rutaArchivo, "utf-8");
    const funciones = parsearCodigo(codigo);
    let codigoDocumentado = "";
    let indiceActual = 0;

    for (const fn of funciones) {
        const descripcionFuncion = `Función ${fn.nombre} con parámetros ${fn.parametros.join(", ")}`;
        const vocabularioTierraMedia = await recuperarFrasesTierraMedia(fn.nombre);

        const comentarioDoc = await generarDocsTierraMedia(descripcionFuncion, vocabularioTierraMedia);

        const regexInicioFuncion = new RegExp(`(async\\s+)?function\\s+${fn.nombre}`);
        const inicioFuncion = codigo.slice(indiceActual).search(regexInicioFuncion) + indiceActual;

        codigoDocumentado += codigo.slice(indiceActual, inicioFuncion);
        codigoDocumentado += `\n/*\n${comentarioDoc}\n*/\n`;

        indiceActual = inicioFuncion;
    }

    codigoDocumentado += codigo.slice(indiceActual);
    const nuevaRutaArchivo = path.join(path.dirname(rutaArchivo), `pinecone_documentado_${path.basename(rutaArchivo)}`);
    fs.writeFileSync(nuevaRutaArchivo, codigoDocumentado, "utf-8");

    console.log(`Archivo documentado guardado en ${nuevaRutaArchivo}`);
}

async function documentarProyecto(rutaDirectorio) {
    const archivos = fs.readdirSync(rutaDirectorio);

    for (const archivo of archivos) {
        const rutaCompleta = path.join(rutaDirectorio, archivo);

        if (fs.lstatSync(rutaCompleta).isDirectory()) {
            await documentarProyecto(rutaCompleta);
        } else if (archivo.endsWith(".js")) {
            console.log(`Procesando archivo: ${rutaCompleta}`);
            await documentarArchivo(rutaCompleta);
        }
    }
}

const rutaProyecto = process.argv[2];
documentarProyecto(rutaProyecto).catch(console.error);
