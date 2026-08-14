import traceback

from fastapi import HTTPException
from yt_dlp.utils import DownloadError, ExtractorError

_FRIENDLY_MESSAGES = [
    ("Unsupported URL", "Esa plataforma o tipo de link no está soportado."),
    ("Private video", "El contenido es privado, no se puede descargar."),
    ("This video is unavailable", "El video no está disponible o fue eliminado."),
    ("Video unavailable", "El video no está disponible o fue eliminado."),
    ("This video is not available", "El video no está disponible en tu región o fue eliminado."),
    ("Sign in to confirm", "Ese contenido requiere iniciar sesión para verse, no se puede descargar sin autenticación."),
    ("age-restricted", "Ese contenido tiene restricción de edad, no se puede descargar sin autenticación."),
    ("HTTP Error 404", "No se encontró el contenido en ese link."),
    (
        "429",
        "Esa plataforma está limitando las descargas por ahora (demasiadas peticiones). Probá de nuevo en unos minutos.",
    ),
    ("Unable to download webpage", "No se pudo acceder a ese link. Verificá que esté bien escrito y disponible."),
]


def to_http_exception(exc: Exception, action: str) -> HTTPException:
    if isinstance(exc, (DownloadError, ExtractorError)):
        message = str(exc)
        for keyword, friendly in _FRIENDLY_MESSAGES:
            if keyword.lower() in message.lower():
                return HTTPException(status_code=400, detail=friendly)
        return HTTPException(
            status_code=400,
            detail=f"No se pudo {action} ese link. Verificá que sea válido, público y de una plataforma soportada.",
        )

    # Genuinely unexpected: print the real traceback so it shows up in the server logs,
    # since the generic 500 below doesn't tell us anything about the actual cause.
    print(f"UNEXPECTED ERROR while trying to {action}:")
    traceback.print_exc()

    return HTTPException(
        status_code=500,
        detail=f"Ocurrió un error inesperado al intentar {action} el contenido.",
    )
