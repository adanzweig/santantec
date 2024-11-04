const fs = require("fs");
const path = require("path");
const axios = require("axios");
require('dotenv').config()

const OPEN_API_KEY = process.env.OPEN_API_KEY

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

async function generarDocsTierraMedia(descripcionFuncion) {
    const prompt = `Como Gandalf, explica el propósito de esta función.\n\nFunción: ${descripcionFuncion}`;

    try {
        const respuesta = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Eres Gandalf de la Tierra Media de la saga Lord Of the Rings." },
                    { role: "system", content: "Puedes hablar de manera corta y concisa" },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPEN_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return respuesta.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generando documentación:", error.response ? error.response.data : error.message);
        return "Documentación no disponible debido a un error.";
    }
}
