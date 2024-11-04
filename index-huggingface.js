const fs = require("fs");
const path = require("path");
const axios = require("axios");
require('dotenv').config();

const HF_API_KEY = process.env.HF_API_KEY;

async function generarDocsTierraMedia(descripcionFuncion) {
    const prompt = `Como Gandalf, explica el propósito de esta función de JavaScript.\n\nFunción: ${descripcionFuncion}`;
    
    try {
        const respuesta = await axios.post(
            "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B",
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
        );
        return respuesta.data[0].generated_text.trim();
    } catch (error) {
        if (error.response && error.response.status === 503) {
            console.log("El modelo está cargando. Reintentando en 30 segundos...");
            await new Promise(resolve => setTimeout(resolve, 30000));
            return generarDocsTierraMedia(descripcionFuncion);
        } else {
            console.error("Error generando documentación:", error);
            return "Documentación no disponible debido a un error.";
        }
    }
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
        const comentario = await generarDocsTierraMedia(descripcionFuncion);

        const regexInicioFuncion = new RegExp(`(async\\s+)?function\\s+${fn.nombre}`);
        const inicioFuncion = codigo.slice(indiceActual).search(regexInicioFuncion) + indiceActual;

        codigoDocumentado += codigo.slice(indiceActual, inicioFuncion);
        codigoDocumentado += `\n/*\n${comentario}\n*/\n`;

        indiceActual = inicioFuncion;
    }

    codigoDocumentado += codigo.slice(indiceActual);
    const nuevaRutaArchivo = path.join(path.dirname(rutaArchivo), `documentado_${path.basename(rutaArchivo)}`);
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
