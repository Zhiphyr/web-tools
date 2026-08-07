import re

_INVALID_CHARS = re.compile(r'[\\/*?:"<>|]')


def sanitize_filename(name: str, fallback: str = "download") -> str:
    cleaned = _INVALID_CHARS.sub("", name).strip()
    return cleaned or fallback
