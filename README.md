# Proyecto de Documentación Estilo Tierra Media
Este proyecto genera documentación al estilo de la Tierra Media para funciones en archivos JavaScript. Utiliza el modelo GPT-Neo para crear descripciones místicas de las funciones como si fueran redactadas por Gandalf, el sabio mago de El Señor de los Anillos. Además, integra embeddings de Pinecone para enriquecer las descripciones con vocabulario relacionado.

## Requisitos
Node.js
Una cuenta en Hugging Face y Pinecone para obtener las claves de API.
Archivo .env con las siguientes variables:
  HF_API_KEY: Clave de API de Hugging Face.
  PINECONE_API_KEY: Clave de API de Pinecone.
  PINECONE_BASE_URL: URL base de Pinecone.
Instalación
Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/tu-proyecto.git
cd tu-proyecto
```

Instala las dependencias:

```bash
npm install
```

Crea un archivo .env en el directorio raíz del proyecto e incluye tus claves de API:

env
```
HF_API_KEY=tu_clave_de_huggingface
PINECONE_API_KEY=tu_clave_de_pinecone
PINECONE_BASE_URL=tu_url_base_de_pinecone
```
Funciones Principales
### obtenerEmbeddings
Este archivo contiene la función obtenerEmbeddings, que genera embeddings a partir de un texto usando el modelo de feature-extraction de Hugging Face y ajusta el vector a 1024 dimensiones.

### recuperarFrasesTierraMedia
Incluye la función recuperarFrasesTierraMedia, que consulta Pinecone para recuperar frases estilo Tierra Media relevantes al contexto del texto de entrada.

### generarDocsTierraMedia
Este archivo realiza la generación de documentación en el estilo de Gandalf, utilizando el modelo GPT-Neo en Hugging Face para devolver una descripción única y mística de cada función de JavaScript.

## Uso
Para procesar un proyecto y agregar la documentación en estilo Tierra Media, ejecuta el siguiente comando en el directorio raíz del proyecto:

```bash
node index-pinecone.js ruta_del_proyecto
```
Donde ruta_del_proyecto es la ruta al directorio con los archivos JavaScript que deseas documentar.

Ejemplo

```bash
node openai.js ./mi_proyecto_js
```
Este comando procesa cada archivo JavaScript en el directorio especificado, añadiendo documentación al estilo Tierra Media sobre cada función.

### Notas
Asegúrate de que los archivos JavaScript estén en el directorio especificado.
Si alguna función no recibe una descripción, verifica las credenciales de tu .env y el estado del servicio de Hugging Face y Pinecone.
Contribuciones
Si deseas contribuir a este proyecto, realiza un fork del repositorio y crea un pull request con tus mejoras o ideas.

### Licencia
Este proyecto está licenciado bajo la MIT License.
