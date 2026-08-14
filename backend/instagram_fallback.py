from curl_cffi import requests as curl_requests

from config import settings

RAPIDAPI_HOST = "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com"


class InstagramFallbackError(Exception):
    pass


def get_instagram_media(url: str) -> dict:
    if not settings.rapidapi_key:
        raise InstagramFallbackError("La API alternativa no está configurada en el servidor.")

    response = curl_requests.get(
        f"https://{RAPIDAPI_HOST}/get-info-rapidapi",
        params={"url": url},
        headers={
            "x-rapidapi-key": settings.rapidapi_key,
            "x-rapidapi-host": RAPIDAPI_HOST,
        },
        timeout=20,
    )

    if response.status_code == 429:
        raise InstagramFallbackError(
            "Se agotó la cuota diaria de la API alternativa. Probá de nuevo más tarde."
        )
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
