import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from config import settings
from errors import to_http_exception
from schemas import DownloadAudioRequest, DownloadVideoRequest, VideoInfoRequest, VideoInfoResponse
from ytdlp_service import download_audio, download_video, get_video_info

app = FastAPI(title="web-tools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


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
