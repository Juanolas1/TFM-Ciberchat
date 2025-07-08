# guardIAn: Chatbot basado en LLM’s especializado en ciberseguridad

> **guardIAn** es un asistente conversacional *open‑source* que combina modelos de lenguaje de última generación con recuperación aumentada de información para acelerar auditorías, análisis de logs y pruebas de penetración tanto para **blue team** como **red team**.

---

## Tabla de contenidos

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Instalación](#instalación)
4. [Datos](#datos)
4. [Entrenamiento](#entrenamiento)
5. [Licencia](#licencia)
6. [Créditos](#créditos)

---

## Introducción

La creciente complejidad de los ciberataques exige herramientas que automaticen tareas de defensa y ofensiva. **guardIAn** nace como Trabajo Fin de Máster en la UDC con el objetivo de proporcionar:

* **Recomendaciones de hardening** basadas en CVE recientes.
* **Soporte a pentesting** guiado por IA.
* **Explicabilidad** de cada respuesta (fuentes citadas y razonamiento).

El chatbot se apoya en un pipeline **Retrieval‑Augmented Generation (RAG)** construido con **LangChain**, que inyecta conocimiento actualizado procedente de foros especializados (Gentoo, Debian, etc.) y de los propios logs del usuario.

---

## Arquitectura

```
/ciberchat
 ├─ entrenamiento/            # notebooks y scripts de fine‑tuning
 ├─ RAG-ElasticSearch/        # Archivo de ElasticSearch, carpeta no seguida en el repo
 │  ├─ bin
 │  └─  └─ elasticsearch-9.0.2/   # binarios ES para desarrollo offline
 ├─ ciberchat/             # proyecto Django
 │  ├─ api/                   # FastAPI endpoints
 │  ├─ ciberchat/             # aplcaición de Django
 │  ├─ frontend/              # React SPA
 │  └─ uploads/               # ficheros subidos por usuarios
 ├─ scraper/
 │  ├─ clear_dataset/         # utilidades de limpieza
 │  │  ├─ debian/
 │  │  └─ gentoo/
 │  └─ dataset_scraper/       # Proyecto de Scrapy
 │     └─ dataset_scraper/
 │        └─ spiders/
 └─ README.md                 # ¡este archivo!
```


## Instalación

### Path backend:
```
/ciberchat
```

### Path frontend:
```
/ciberchat/frontend
```

### Como arrancar la web paso a paso


Dentro del directotio del frontend se debe de compilar las interfaces de react con:

```
npm run build
```

Una vez compiladas las interfaces se debe de entrar al directotio del backend donde es necesario arrancar el servicio con el comando:

```
python manage.py runserver
```

Por defecto está corriendo en ```localhost:8000```


## Datos

Los datos se recolectan mediante **Scrapy** estando situado en el path ```/scraper/dataset_scraper``` `podemos ejecutar los comandos:

```bash
cd scraper/dataset_scraper

# Debian
scrapy crawl debian

# Gentoo
scrapy crawl gentoo
```
Esquema de datos actual:
```
{
  "url": ["string"],               // URL del hilo de discusión
  "title": ["string"],             // Título del hilo de discusión
  "answers": [                     // Array de respuestas en el hilo
    {
      "username": ["string"],      // Nombre de usuario del autor de la respuesta
      "rank": ["string"],          // Rango del usuario en el foro (opcional)
      "published_at": ["string"],  // Fecha y hora de publicación en formato ISO
      "response_text": ["string"]  // Texto completo de la respuesta
    },
    // Más respuestas...
  ]
}
```

La limpieza de los datos se efectúa con los scripts correspondientes de cada foro que están en las rutas: ```scraper/clear_dataset/debian``` & ```scraper/clear_dataset/gentoo``` el orden de ejecución de los scripts es siguiendo los números que tienen al principio del nombre.

---

## Entrenamiento

Script utilizando LoRA ubicado en ```entrenamiento```

---

## Licencia

Este proyecto se distribuye bajo licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

## Créditos

Proyecto desarrollado por Juan Toirán Freire como TFM en el *Máster en Ingeniería Informática – UDC*.

* **Alumno:** Juan Toirán Freire
* **Dirección:** Eliseo Bao Souto & Miguel Anxo Pérez Vila
* Logo inspirado en el búho de *guarddian* 🦉

> ¡Gracias por probar **guardIAn**! Si tienes preguntas o sugerencias, abre un *issue*.





