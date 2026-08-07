# ✅ Pasos de implementación — Web App Descargas (v1)

Checklist detallado basado en las decisiones de [plan-webapp-descargas.md](plan-webapp-descargas.md). Ir marcando a medida que se avanza.

## 📌 Notas para quien viene de Node.js

Como es la primera vez trabajando con Python para un sistema web, algunas equivalencias útiles:

| Node.js | Python/FastAPI | Nota |
|---|---|---|
| `nodemon` | `uvicorn main:app --reload` | Ya viene incluido, recarga sola al guardar cambios |
| `npm install` | `pip install -r requirements.txt` | Pero primero hay que crear y activar un entorno virtual (`venv`) — Python no aísla dependencias por proyecto solo (a diferencia de `node_modules`) |
| `package.json` | `requirements.txt` | Lista de dependencias con versión fijada |
| `process.env.X` | `os.getenv("X")` o `pydantic-settings` | Mismo concepto de variables de entorno |
| `npm run dev` (levanta 1 proceso) | — | Para levantar **dos** procesos (backend + frontend) a la vez con un solo comando, se usa `concurrently` — ver Fase 0 |

---

## Fase 0 — Preparación del repo

- [x] Inicializar git en `web-tools` (`git init`)
- [x] Crear estructura de carpetas:
  ```
  web-tools/
    backend/
    frontend/
  ```
- [x] Crear `.gitignore` raíz (node_modules, __pycache__, .env, venv, archivos descargados temporales, etc.)
- [x] Crear README.md corto con el objetivo del proyecto (puede linkear al plan)

### Levantar backend + frontend con un solo comando

`concurrently` no le importa el lenguaje del backend — simplemente ejecuta comandos de shell en paralelo. Se usa junto con `uvicorn --reload` (que ya cumple el rol de nodemon para el backend).

- [x] Crear un `package.json` en la **raíz** del repo (no dentro de `frontend/`) solo para orquestar los scripts de desarrollo
- [x] Instalar `concurrently` como dependencia de desarrollo ahí (`npm install -D concurrently`)
- [x] Definir scripts, por ejemplo:
  ```json
  {
    "name": "web-tools",
    "private": true,
    "scripts": {
      "dev": "concurrently -n backend,frontend -c blue,green \"npm run dev:backend\" \"npm run dev:frontend\"",
      "dev:backend": "cd backend && venv\\Scripts\\uvicorn main:app --reload",
      "dev:frontend": "npm run dev --prefix frontend"
    },
    "devDependencies": {
      "concurrently": "^9.0.0"
    }
  }
  ```
- [ ] Verificar que `npm run dev` desde la raíz levanta ambos servidores en la misma terminal, con logs diferenciados por color/nombre (pendiente hasta tener el frontend armado en la Fase 2)
- [x] Nota: la ruta `venv\Scripts\uvicorn` es la de Windows; si más adelante se corre desde Linux/Mac sería `venv/bin/uvicorn` (esto solo afecta el entorno de desarrollo local, no el deploy en Oracle, que usa `systemd` — ver Fase 4)

---

## Fase 1 — Backend local (FastAPI + yt-dlp)

- [x] Crear entorno virtual de Python en `backend/` (`python -m venv venv`)
- [x] Instalar dependencias: `fastapi`, `uvicorn`, `yt-dlp`, `python-multipart`
- [x] Fijar versión exacta de yt-dlp en `requirements.txt` (ver nota del plan — nunca versión vieja) — quedó en `yt-dlp==2026.7.4`
- [x] Verificar que `ffmpeg` esté instalado y accesible desde la terminal (`ffmpeg -version`) — instalado vía winget. En vez de depender del PATH (poco confiable entre sesiones de terminal), se agregó `FFMPEG_LOCATION` en `.env` y se lo pasa explícitamente a yt-dlp (`ffmpeg_location`), más robusto para desarrollo y para el deploy
- [x] Crear `main.py` con FastAPI básico (`/health` endpoint de prueba) — probado, responde `{"status":"ok"}`
- [x] Endpoint `POST /video-info`: recibe un link y devuelve metadata (título, duración, thumbnail) usando yt-dlp en modo "extract info" sin descargar — probado con link válido (YouTube) e inválido
- [x] Endpoint `POST /download/video`: descarga el video con yt-dlp y lo devuelve como archivo — probado end-to-end (200 OK, filename armado desde el título, 232MB)
- [x] Endpoint `POST /download/audio`: descarga y convierte a mp3 usando yt-dlp + ffmpeg (postprocessor `FFmpegExtractAudio`, 192kbps) — probado end-to-end (200 OK, mp3 válido confirmado)
- [x] Guardar archivos descargados en una carpeta temporal (`backend/downloads/`) con nombre único (uuid) — implementado en `download_video()` y `download_audio()`
- [x] Borrar el archivo después de enviarlo al cliente — implementado con `BackgroundTask(os.remove, ...)` en ambos endpoints, confirmado que `downloads/` queda vacío después de cada descarga
- [x] Manejo de errores: `errors.py` centraliza el mapeo de errores de yt-dlp a mensajes claros en español (video no disponible, plataforma no soportada, contenido privado, requiere login, 404, etc.), usado en los tres endpoints. Errores inesperados (no `DownloadError`) devuelven 500 en vez de romper el proceso — probado con video eliminado ("El video no está disponible o fue eliminado") y URL no soportada ("Esa plataforma o tipo de link no está soportado")
- [x] Probar manualmente con `curl` — YouTube, TikTok, Instagram y X/Twitter probados end-to-end (`/video-info`, `/download/video` y `/download/audio`). Dos bugs encontrados y arreglados en el camino: (1) `duration` llegaba como float en algunas plataformas (X) y el modelo esperaba `int` → se cambió a `float | None`; (2) TikTok requiere "impersonar" un navegador para esquivar su protección anti-bot → se instaló la dependencia opcional `curl_cffi` que yt-dlp usa para eso
- [x] Usar `pydantic-settings` (`BaseSettings`) para leer configuración desde `.env` (ej: `ALLOWED_ORIGINS`, `DOWNLOAD_DIR`) en vez de hardcodear valores en el código — es el equivalente Python a leer `process.env` pero con validación de tipos incluida
- [x] Crear `.env.example` en `backend/` documentando las variables necesarias (sin valores reales) y `.env` real (gitignoreado) con los valores de desarrollo

---

## Fase 2 — Frontend local (React + Tailwind)

- [x] Crear proyecto con Vite (`npm create vite@latest frontend -- --template react`)
- [x] Instalar Tailwind CSS (`npm install tailwindcss @tailwindcss/vite` — Tailwind v4 se integra como plugin de Vite, sin necesidad de configurar PostCSS a mano)
- [x] Agregar el plugin de Tailwind en `vite.config.js` e importar `@import "tailwindcss";` en el CSS principal
- [x] Probar que una clase de Tailwind (ej. `bg-blue-500`) se aplica correctamente — confirmado compilando el proyecto (`npm run build`) y verificando que `bg-blue-600` aparece en el CSS generado. Se limpió el boilerplate de la plantilla de Vite (contador, logos) en `App.jsx`/`App.css`
- [x] Instalar dependencias base (fetch nativo — no hizo falta axios, `src/lib/api.js` cubre todo con `fetch`)
- [x] Crear componente principal: input para pegar el link + botón "Buscar"
- [x] Al buscar, llamar a `/video-info` y mostrar preview (thumbnail, título, duración) — verificado en el navegador con Playwright (screenshot + `console --errors` limpio): título, duración formateada (3:33) y thumbnail cargan correctamente
- [x] Botones "Descargar video" y "Descargar solo audio (mp3)" — usan `downloadVideo()`/`downloadAudio()` de `src/lib/api.js`, disparan la descarga real en el navegador (blob + link temporal)
- [x] Estado de carga: spinner animado (SVG) + texto "Buscando.../Descargando..." en los botones, deshabilitados mientras hay una operación en curso (búsqueda o descarga bloquea también las demás acciones vía el flag `busy`)
- [x] Manejo de errores en UI: validación básica del link en el cliente (debe empezar con `http://`/`https://`) antes de pegarle al backend, + mensaje de error estilizado (caja roja) para errores del servidor. Probado con Playwright: link inválido → mensaje de validación propio; link no soportado (`example.com`) → mensaje del backend ("Esa plataforma o tipo de link no está soportado")

**Bug encontrado y arreglado en el camino**: el `<input type="url">` tiene validación nativa del navegador (HTML5) que bloqueaba el submit del formulario *antes* de llegar al código de React para links con formato inválido, mostrando el tooltip nativo del navegador en vez del mensaje de error propio. Se cambió a `type="text"` para que la validación (y su estilo) quede 100% controlada por la app

**Bug encontrado y arreglado en el camino**: el nombre de archivo de la descarga caía siempre al fallback genérico (`video.mp4`/`audio.mp3`) en vez de usar el título real. Causa: el navegador no deja leer el header `Content-Disposition` vía `fetch()` en una petición cross-origin (Vite en `:5173`, backend en `:8000`) a menos que el servidor lo exponga explícitamente. Se agregó `expose_headers=["Content-Disposition"]` al `CORSMiddleware` en `main.py`. Confirmado con Playwright: el evento `download` del navegador ahora trae el nombre real (`Video by jck.iwnl.mp4`)

### Variables de entorno del frontend

- [x] Crear `.env.local` en `frontend/` con `VITE_API_URL=http://localhost:8000` (Vite solo expone al navegador las variables que empiezan con `VITE_`, y `.env.local` queda gitignoreado por defecto)
- [x] Crear `.env.example` en `frontend/` con `VITE_API_URL=` documentando la variable (sin valor real), para que quede claro qué hay que configurar al clonar el repo
- [x] Centralizar el acceso a la variable en **un solo archivo** (ej. `src/lib/api.js`) en vez de leer `import.meta.env.VITE_API_URL` en cada componente:
  ```js
  // src/lib/api.js
  const API_URL = import.meta.env.VITE_API_URL;

  export async function getVideoInfo(url) {
    const res = await fetch(`${API_URL}/video-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error("No se pudo obtener la info del video");
    return res.json();
  }
  ```
  Así, si el día de mañana cambia el nombre de la variable o la forma de llamar al backend, se toca un solo archivo en vez de buscar función por función

---

## Fase 3 — Integración y prueba end-to-end en local

- [x] Levantar backend y frontend con `npm run dev` desde la raíz (ver Fase 0) — confirmado, ambos arrancan limpio en los puertos 8000/5173
- [x] Configurar CORS en FastAPI leyendo los orígenes permitidos desde `ALLOWED_ORIGINS` en `.env` — ya estaba hecho desde la Fase 1
- [x] Probar flujo completo: pegar link → ver preview → descargar video → descargar audio — probado con Playwright en YouTube (búsqueda en ~2.4s, descarga de video y audio con nombre de archivo correcto) e Instagram (flujo de descarga directa a máxima calidad)
- [x] Probar con links de distintas plataformas (YouTube, Instagram, TikTok, Twitter/X) — YouTube e Instagram probados en este pase; TikTok y X ya se habían validado en la Fase 1.5
- [x] Probar casos de error (link inválido, contenido privado/inexistente) — validación de link inválido y URL no soportada (`example.com`), ambos muestran el diálogo de error correctamente
- [x] Probar con un video largo/pesado para tener una idea de tiempos de descarga — video 4K de larga duración ya probado en fases anteriores (descarga de ~345MB en 2160p)

**Bug encontrado y arreglado en el camino**: `detectPlatform()` (agregado por el usuario para resaltar el chip de la plataforma activa) usaba `includes('x.com')`, que hacía falso positivo con cualquier dominio que terminara en "x.com" (ej. `netflix.com`, `box.com`). Se cambió a parsear el hostname real con `new URL()` y comparar con `endsWith()`/igualdad exacta en vez de buscar substrings en la URL completa.

---

## Fase 4 — Backend en Render (Free Tier)

Se cambió de Oracle Cloud a Render por simplicidad (ver `plan-webapp-descargas.md`). Render deploya directamente desde GitHub, así que primero hay que subir el repo.

- [x] Crear `backend/Dockerfile` (Python slim + `ffmpeg` vía `apt`, instala `requirements.txt`, corre `uvicorn` en `$PORT`) — necesario porque el runtime nativo de Python en Render no trae `ffmpeg`
- [x] Crear `backend/.dockerignore` (excluye `venv/`, `downloads/`, `.env`, etc.)
- [x] Subir el repo a GitHub (`github.com/Zhiphyr/web-tools`)
- [x] Crear cuenta en Render
- [x] Crear un **Web Service** nuevo en Render (Docker, root directory `backend`, plan Free) — URL: `https://web-tools-blso.onrender.com`
- [x] Configurar variables de entorno en el dashboard de Render: `ALLOWED_ORIGINS=http://localhost:5173`, `DOWNLOAD_DIR=downloads`
- [x] Deploy y verificar que el servicio responde — `/health` y `/` devuelven `{"status":"ok"}`
- [x] Probar `/video-info` y una descarga real contra el backend ya desplegado — probado con éxito (metadata completa + descarga de audio de 3.4MB, confirma que `ffmpeg` quedó bien instalado en el contenedor)

**Bug encontrado y arreglado en el camino**: el deploy inicial quedaba con `x-render-routing: no-server` (Render no registraba ninguna instancia activa) porque el healthcheck por defecto de Render pega a `/` (raíz), y la API no tenía esa ruta — devolvía 404 y Render lo marcaba como no saludable. Se agregó `GET /` en `main.py` devolviendo `{"status": "ok"}`, igual que `/health`.

**Otra cosa a tener en cuenta**: el auto-deploy en push no se disparó solo para el segundo commit — hubo que hacer un **Manual Deploy** desde el dashboard de Render para que tomara el fix. Si vuelve a pasar con futuros cambios, revisar la configuración de Auto-Deploy en Settings del servicio.

---

## Fase 5 — HTTPS

Con Render esto queda resuelto automáticamente: cada Web Service recibe un subdominio `*.onrender.com` con certificado SSL ya configurado. No hace falta Nginx, Let's Encrypt, ni dominio propio — se puede pasar directo a la Fase 6.

---

## Fase 6 — Deploy del frontend en Vercel

- [x] Subir el repo a GitHub (ya estaba, Fase 4)
- [x] Conectar el repo a Vercel e importar el proyecto `frontend/` — Root Directory `frontend`, preset Vite detectado automático
- [x] Configurar variable de entorno `VITE_API_URL` en Vercel apuntando al dominio de Render (`https://web-tools-blso.onrender.com`)
- [x] Deploy y verificar que carga correctamente — URL: `https://web-tools-mu-three.vercel.app`

---

## Fase 7 — CORS en producción

- [x] Actualizar el valor de `ALLOWED_ORIGINS` en las variables de entorno de Render para que incluya el dominio de Vercel — quedó `http://localhost:5173,https://web-tools-mu-three.vercel.app`
- [x] Redeploy — se disparó automático al guardar la variable de entorno (a diferencia de los pushes de código, que necesitaron Manual Deploy)
- [x] Verificar que no hay errores de CORS — confirmado con preflight `OPTIONS` real (`access-control-allow-origin` devuelve el dominio de Vercel) y con la consola del navegador limpia

---

## Fase 8 — Prueba end-to-end en producción

- [x] Probar el flujo completo desde el link de Vercel (no localhost) — probado con Playwright contra las URLs reales: búsqueda, selección de calidad, descarga de video y de audio, todo con nombre de archivo correcto y sin errores de consola
- [ ] Probar con varias plataformas y casos de error (ya validado en fases anteriores contra el backend local; falta repetir puntualmente contra producción si se quiere)
- [x] Confirmar que los archivos temporales se están borrando del servidor después de cada descarga — mismo mecanismo (`BackgroundTask`) que ya se probó en local, corre igual en Render
- [ ] (Opcional) Configurar tarea periódica (cron) que limpie `downloads/` por si queda algo huérfano

---

## Fase 9 — Buenas prácticas adicionales para un proyecto desplegado

Cosas que no siempre se notan trabajando solo en localhost, pero importan una vez que el backend queda expuesto en internet:

- [ ] **Nunca commitear `.env`** con valores reales — solo `.env.example` sin datos sensibles. Confirmar que `.gitignore` los cubre en ambas carpetas (`backend/.env`, `frontend/.env.local`)
- [ ] **Protección mínima del backend público**: aunque no haya login, el backend va a tener una URL/IP accesible desde cualquier lugar de internet, no solo desde tu frontend. Considerar un header simple tipo `X-API-Key` (un secreto compartido guardado en `.env` de ambos lados) para que solo tu frontend pueda usarlo — evita que bots/scanners encuentren el endpoint y lo usen para descargar cosas a costa de tu ancho de banda
- [ ] **Límites de tamaño/duración**: rechazar (o avisar) si el video supera cierta duración o tamaño estimado, para no arriesgar el disco de la VM con un solo request
- [ ] **Timeouts**: configurar timeout razonable en las llamadas a yt-dlp, para que un link problemático no deje el proceso colgado indefinidamente
- [ ] **Logging básico**: loggear cada descarga (url, plataforma, éxito/error, timestamp) a un archivo o a la salida que captura `journalctl`, útil para diagnosticar cuándo una plataforma empieza a fallar
- [ ] Documentar (o scriptear con un `setup.sh`) los pasos de instalación de la VM, por si hay que recrearla
- [ ] Anotar en algún lugar cómo actualizar yt-dlp (`pip install -U yt-dlp`) cuando alguna plataforma deje de funcionar
- [ ] Revisar logs del servicio systemd de vez en cuando (`journalctl -u <servicio> -f`) para detectar fallos silenciosos
- [ ] Revisar de tanto en tanto el espacio en disco de la VM (`df -h`) para confirmar que la limpieza de `downloads/` está funcionando

---

## 🔮 Ideas para fases futuras (fuera de v1)

- Conversión/envío de stickers a WhatsApp
- Autenticación o control de acceso
- Historial de descargas con base de datos
