# 🌐 Web App Personal — Descarga de Video/Audio (v1)

Documento de referencia con las decisiones tomadas para el desarrollo del proyecto.

## 🎯 Objetivo v1

Herramienta web 100% personal (sin login, sin BD, link conocido solo por mí) que permite:

- Pegar un link de cualquier plataforma (YouTube, Instagram, TikTok, Twitter/X, etc.)
- Descargar el video
- Convertir y descargar solo el audio (mp3)

**Fuera de alcance para v1** (posibles fases futuras):
- Conversión/envío de stickers a WhatsApp
- Autenticación o control de acceso
- Base de datos / historial de descargas

## 🧠 Decisiones tomadas

| Aspecto | Decisión | Motivo |
|---|---|---|
| Frontend | React | Aprendizaje + más profesional que HTML/JS plano |
| Backend | Python + FastAPI | yt-dlp es nativo de Python, FastAPI es rápido de aprender |
| Hosting frontend | Vercel | Gratis, deploy simple, ideal para React |
| Hosting backend | Render (Free Tier) | Deploy simple vía Git + Docker, HTTPS automático incluido. Se cambió de Oracle Cloud por simplicidad — el trade-off es que el servicio "duerme" tras 15 min de inactividad (~30-50s de arranque en frío), aceptable para un uso no constante |
| Base de datos | No se usa | No hay usuarios ni necesidad de persistencia en v1 |
| Seguridad | Ninguna especial | Uso 100% personal, el link no se comparte públicamente |

## 🛠️ Stack tecnológico

### Frontend
- **React**
- Deploy en **Vercel**

### Backend
- **Python 3** + **FastAPI**
- **yt-dlp** — descarga de video/audio
- **ffmpeg** — conversión de audio/formatos
- Deploy en **Render** (Free Tier, vía Docker)

## ⚠️ Nota importante — versión de yt-dlp

**Fijar la versión exacta en `requirements.txt`:**

```
yt-dlp==2026.7.4
```

**No usar versiones viejas (ej. 2024.x).** Ya hubo un caso probado en un bot de Telegram anterior donde, con una versión de 2024, **fallaba la descarga de videos de TikTok**. yt-dlp se actualiza muy seguido porque las plataformas (especialmente TikTok e Instagram) cambian sus protecciones anti-scraping constantemente — una versión desactualizada puede romper la descarga de una o varias plataformas sin previo aviso.

Recomendación adicional: revisar de tanto en tanto si hay una versión más nueva y actualizar (`pip install -U yt-dlp`), sobre todo si en algún momento una plataforma deja de funcionar de golpe — es señal de que yt-dlp necesita actualizarse.

## 🔒 HTTPS

Como el frontend vive en Vercel (que fuerza `https://`), el backend también necesita HTTPS — si no, los navegadores bloquean las peticiones por **contenido mixto** (mixed content). Con Render esto queda resuelto automáticamente: cada servicio recibe un subdominio `*.onrender.com` con certificado SSL ya configurado, sin necesidad de Nginx ni Let's Encrypt manual.

## 🌉 CORS — otro punto a no olvidar

Como el frontend (Vercel) y el backend (Render) van a vivir en dominios distintos, hay que configurar **CORS en FastAPI** para permitir explícitamente que el frontend pueda hacerle peticiones al backend. Sin esto, el navegador bloquea las llamadas aunque el backend esté funcionando bien.

## 📋 Plan de trabajo (orden recomendado)

1. Backend en FastAPI corriendo **local**, con yt-dlp y ffmpeg funcionando para video y audio
2. Frontend en React corriendo **local**, conectado al backend local
3. Validar todo el flujo completo en local (link → descarga video / audio)
4. Migrar backend a Render (Free Tier):
   - Subir el repo a GitHub (Render deploya desde ahí)
   - Crear cuenta en Render y un Web Service nuevo apuntando a `backend/`, con Docker como runtime (necesario para poder instalar `ffmpeg`, que no viene en el buildpack nativo de Python)
   - Configurar variables de entorno (`ALLOWED_ORIGINS`, `DOWNLOAD_DIR`) desde el dashboard de Render
   - HTTPS queda resuelto automáticamente por Render
5. Deploy del frontend en Vercel
6. Configurar CORS en el backend para permitir el dominio de Vercel
7. Prueba end-to-end en producción

## 💡 Recomendaciones adicionales a considerar

- **Cold start**: el free tier de Render duerme el servicio tras ~15 min de inactividad — la primera petición después de eso tarda ~30-50s en responder mientras arranca de nuevo. Aceptable para uso personal no constante, pero conviene tenerlo en cuenta al probar.
- **Límite de tamaño/tiempo**: el free tier de Render tiene límites de RAM/CPU (recursos compartidos) — vale la pena probar con videos largos/pesados antes de asumir que "todo" va a funcionar sin ajustes.
- **Limpieza de archivos temporales**: los videos/audios descargados en el servidor deben borrarse después de servírselos al usuario (ya implementado) — importante igual en Render porque el disco es efímero (se resetea en cada redeploy).
- **Manejo de errores de yt-dlp**: algunas plataformas (Instagram, contenido privado) pueden fallar o requerir cookies de sesión — conviene que el backend devuelva mensajes de error claros en vez de fallar en silencio.
- **Variables de entorno**: separar configuración sensible (si en el futuro se agrega algo como una API key) usando variables de entorno en el dashboard de Render, para no dejar nada hardcodeado en el código.
