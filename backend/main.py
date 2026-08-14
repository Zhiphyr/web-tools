import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from config import settings
from errors import to_http_exception
from instagram_fallback import (
    InstagramFallbackError,
    download_instagram_media_file,
    get_instagram_media,
)
from schemas import (
    DownloadAudioRequest,
    DownloadVideoRequest,
    InstagramFallbackDownloadRequest,
    InstagramFallbackRequest,
    InstagramFallbackResponse,
    VideoInfoRequest,
    VideoInfoResponse,
)
from utils import sanitize_filename
from ytdlp_service import download_audio, download_video, get_video_info

app = FastAPI(title="web-tools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/video-info", response_model=VideoInfoResponse)
def video_info(payload: VideoInfoRequest):
    try:
        return get_video_info(payload.url)
    except Exception as exc:
        raise to_http_exception(exc, "obtener información de")


@app.post("/download/video")
def download_video_endpoint(payload: DownloadVideoRequest):
    try:
        file_path, download_name = download_video(payload.url, payload.height)
    except Exception as exc:
        raise to_http_exception(exc, "descargar el video de")

    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=download_name,
        background=BackgroundTask(os.remove, file_path),
    )


@app.post("/download/audio")
def download_audio_endpoint(payload: DownloadAudioRequest):
    try:
        file_path, download_name = download_audio(payload.url, payload.quality)
    except Exception as exc:
        raise to_http_exception(exc, "descargar el audio de")

    media_type = "audio/wav" if file_path.suffix == ".wav" else "audio/mpeg"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=download_name,
        background=BackgroundTask(os.remove, file_path),
    )


@app.post("/instagram-fallback", response_model=InstagramFallbackResponse)
def instagram_fallback(payload: InstagramFallbackRequest):
    try:
        return get_instagram_media(payload.url)
    except InstagramFallbackError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error inesperado al usar la API alternativa.",
        )


@app.post("/instagram-fallback/download")
def instagram_fallback_download(payload: InstagramFallbackDownloadRequest):
    try:
        file_path, media_type = download_instagram_media_file(payload.url, payload.is_video)
    except InstagramFallbackError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    download_name = sanitize_filename(payload.filename or "instagram-media") + file_path.suffix

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=download_name,
        background=BackgroundTask(os.remove, file_path),
    )
