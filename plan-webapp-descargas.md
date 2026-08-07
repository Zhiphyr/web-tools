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
| Hosting backend | Oracle Cloud Free Tier | Gratis indefinido, sin "sleep", y sirve como aprendizaje de Linux/servidores/DevOps |
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
- Deploy en **Oracle Cloud Free Tier** (VM Ubuntu)

## ⚠️ Nota importante — versión de yt-dlp

**Fijar la versión exacta en `requirements.txt`:**

```
yt-dlp==2026.7.4
```

**No usar versiones viejas (ej. 2024.x).** Ya hubo un caso probado en un bot de Telegram anterior donde, con una versión de 2024, **fallaba la descarga de videos de TikTok**. yt-dlp se actualiza muy seguido porque las plataformas (especialmente TikTok e Instagram) cambian sus protecciones anti-scraping constantemente — una versión desactualizada puede romper la descarga de una o varias plataformas sin previo aviso.

Recomendación adicional: revisar de tanto en tanto si hay una versión más nueva y actualizar (`pip install -U yt-dlp`), sobre todo si en algún momento una plataforma deja de funcionar de golpe — es señal de que yt-dlp necesita actualizarse.

## 🔒 HTTPS — paso obligatorio, no saltar

Como el frontend vive en Vercel (que fuerza `https://`), el backend en Oracle Cloud **debe** tener HTTPS también. Si el backend queda en `http://` sin certificado, los navegadores van a bloquear las peticiones del frontend por **contenido mixto** (mixed content) — la web simplemente no va a funcionar.

Para esto hace falta configurar en el servidor de Oracle:
- **Nginx** como proxy reverso delante de FastAPI
- **Certificado SSL** con **Let's Encrypt** (gratis)
- Idealmente, un dominio o subdominio apuntando a la IP del servidor (Let's Encrypt requiere un dominio, no funciona solo con IP)

## 🌉 CORS — otro punto a no olvidar

Como el frontend (Vercel) y el backend (Oracle) van a vivir en dominios distintos, hay que configurar **CORS en FastAPI** para permitir explícitamente que el frontend pueda hacerle peticiones al backend. Sin esto, el navegador bloquea las llamadas aunque el backend esté funcionando bien.

## 📋 Plan de trabajo (orden recomendado)

1. Backend en FastAPI corriendo **local**, con yt-dlp y ffmpeg funcionando para video y audio
2. Frontend en React corriendo **local**, conectado al backend local
3. Validar todo el flujo completo en local (link → descarga video / audio)
4. Migrar backend a Oracle Cloud Free Tier:
   - Crear cuenta e instancia (VM Ubuntu)
   - Conexión SSH, instalación de Python/ffmpeg/dependencias
   - Configurar firewall (Oracle Security List + firewall del sistema)
   - Dejar el backend corriendo 24/7 como servicio (systemd)
   - Configurar Nginx + Let's Encrypt (HTTPS)
5. Deploy del frontend en Vercel
6. Configurar CORS en el backend para permitir el dominio de Vercel
7. Prueba end-to-end en producción

## 💡 Recomendaciones adicionales a considerar

- **Límite de tamaño/tiempo**: aunque no hay límite artificial de Telegram, sigue existiendo el límite real de disco y ancho de banda del servidor Oracle Free Tier — vale la pena probar con videos largos/pesados antes de asumir que "todo" va a funcionar sin ajustes.
- **Limpieza de archivos temporales**: los videos/audios descargados en el servidor deben borrarse después de servírselos al usuario (o con una tarea periódica), para no llenar el disco con el tiempo.
- **Manejo de errores de yt-dlp**: algunas plataformas (Instagram, contenido privado) pueden fallar o requerir cookies de sesión — conviene que el backend devuelva mensajes de error claros en vez de fallar en silencio.
- **Variables de entorno**: separar configuración sensible (si en el futuro se agrega algo como una API key) usando un archivo `.env`, para no dejar nada hardcodeado en el código.
- **Backups de configuración del servidor**: ya que Oracle Free Tier es manual, es buena práctica documentar (o scriptear) los pasos de instalación, por si hay que recrear la VM en el futuro.
