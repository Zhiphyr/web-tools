import uuid
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from curl_cffi import requests as curl_requests

from config import settings
from ytdlp_service import DOWNLOAD_DIR

RAPIDAPI_HOST = "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com"


class InstagramFallbackError(Exception):
    pass


def _strip_query(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


_CONTENT_PATH_PREFIXES = ("/reel/", "/reels/")


def _is_instagram_content_url(url: str) -> bool:
    parts = urlsplit(url)
    hostname = parts.netloc.lower()
    if hostname != "instagram.com" and not hostname.endswith(".instagram.com"):
        return False
    path = parts.path if parts.path.endswith("/") else parts.path + "/"
    return path.lower().startswith(_CONTENT_PATH_PREFIXES)


class _QuotaExceeded(Exception):
    pass


def _request_media_info(clean_url: str, key: str) -> dict:
    response = curl_requests.get(
        f"https://{RAPIDAPI_HOST}/get-info-rapidapi",
        params={"url": clean_url},
        headers={
            "x-rapidapi-key": key,
            "x-rapidapi-host": RAPIDAPI_HOST,
        },
        timeout=20,
    )

    if response.status_code == 429:
        raise _QuotaExceeded()
    if response.status_code == 204 or not response.content:
        raise InstagramFallbackError(
            "No se encontró ese contenido. Puede ser privado, haber sido eliminado, o no estar disponible."
        )
    if response.status_code != 200:
        raise InstagramFallbackError(
            f"La API alternativa respondió con un error ({response.status_code})."
        )

    data = response.json()
    if data.get("error"):
        raise InstagramFallbackError("No se pudo obtener ese contenido de Instagram.")

    download_url = data.get("download_url")
    if not download_url:
        raise InstagramFallbackError("No se encontró un link de descarga para ese contenido.")

    caption = (data.get("caption") or "").strip()
    shortcode = data.get("shortcode") or ""
    title = caption.splitlines()[0] if caption else f"Instagram - {shortcode}"

    return {
        "title": title[:200],
        "thumbnail": data.get("thumb"),
        "duration": None,
        "uploader": None,
        "download_url": download_url,
        "is_video": data.get("type") == "video",
        "is_carousel": False,
        "carousel_count": None,
    }


def get_instagram_media(url: str) -> dict:
    keys = settings.rapidapi_keys
    if not keys:
        raise InstagramFallbackError("La API alternativa no está configurada en el servidor.")

    clean_url = _strip_query(url)

    if not _is_instagram_content_url(clean_url):
        raise InstagramFallbackError(
            "Esta API alternativa solo funciona con links de Reels de Instagram."
        )

    for key in keys:
        try:
            return _request_media_info(clean_url, key)
        except _QuotaExceeded:
            continue

    raise InstagramFallbackError(
        "Se agotó la cuota de la API alternativa en todas las cuentas configuradas. Probá de nuevo más tarde."
    )


def download_instagram_media_file(cdn_url: str, is_video: bool) -> tuple[Path, str]:
    # We proxy this ourselves (instead of linking straight to the CDN url) because
    # whether that link triggers a download or just opens the video inline depends
    # on headers Instagram's CDN sets inconsistently — serving it from our own
    # backend lets us force a real download every time.
    response = curl_requests.get(cdn_url, timeout=30)
    if response.status_code != 200 or not response.content:
        raise InstagramFallbackError("No se pudo descargar el archivo desde Instagram.")

    if is_video:
        ext, media_type = ".mp4", "video/mp4"
    else:
        ext, media_type = ".jpg", "image/jpeg"

    file_path = DOWNLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
    file_path.write_bytes(response.content)
    return file_path, media_type
