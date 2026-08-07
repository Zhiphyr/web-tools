import uuid
from pathlib import Path

import yt_dlp

from config import settings
from utils import sanitize_filename

DOWNLOAD_DIR = Path(settings.download_dir)
DOWNLOAD_DIR.mkdir(exist_ok=True)

STANDARD_VIDEO_TIERS = (2160, 1440, 1080, 720, 480, 360, 240, 144)
AUDIO_BITRATES_KBPS = {"320": 320, "128": 128}
WAV_BITRATE_KBPS = 1411  # 16-bit stereo 44.1kHz PCM
AUDIO_QUALITIES = {"320", "128", "wav"}


def _resolve_downloaded_path(ydl: yt_dlp.YoutubeDL, info: dict) -> Path:
    requested = info.get("requested_downloads")
    if requested:
        return Path(requested[0]["filepath"])
    return Path(ydl.prepare_filename(info))


def _best_format(formats: list[dict], max_height: int | None, want_video: bool) -> dict | None:
    candidates = []
    for fmt in formats:
        height = fmt.get("height")
        vcodec = fmt.get("vcodec")
        acodec = fmt.get("acodec")
        if want_video:
            if not height or vcodec in (None, "none"):
                continue
            if max_height is not None and height > max_height:
                continue
        else:
            if vcodec not in (None, "none") or acodec in (None, "none"):
                continue
        candidates.append(fmt)

    if not candidates:
        return None

    if want_video:
        candidates.sort(key=lambda f: f.get("height") or 0, reverse=True)
    else:
        candidates.sort(key=lambda f: f.get("abr") or f.get("tbr") or 0, reverse=True)
    return candidates[0]


def _format_size(fmt: dict | None, duration: float | None) -> int | None:
    if not fmt:
        return None
    size = fmt.get("filesize") or fmt.get("filesize_approx")
    if size:
        return int(size)
    tbr = fmt.get("tbr")
    if tbr and duration:
        return int(tbr * 1000 / 8 * duration)
    return None


def _available_video_tiers(formats: list[dict]) -> list[int]:
    heights = {
        fmt.get("height")
        for fmt in formats
        if fmt.get("height") and fmt.get("vcodec") not in (None, "none")
    }
    tiers = sorted((h for h in STANDARD_VIDEO_TIERS if h in heights), reverse=True)
    if tiers:
        return tiers
    # Fallback for non-standard heights: just offer the single best one available.
    return [max(heights)] if heights else []


def _video_qualities(formats: list[dict], duration: float | None) -> list[dict]:
    qualities = []
    for height in _available_video_tiers(formats):
        video_fmt = _best_format(formats, height, want_video=True)
        video_size = _format_size(video_fmt, duration)

        total = video_size
        if video_fmt and video_fmt.get("acodec") in (None, "none"):
            audio_fmt = _best_format(formats, None, want_video=False)
            if total is not None:
                total += _format_size(audio_fmt, duration) or 0

        qualities.append({"height": height, "label": f"{height}p", "size": total})
    return qualities


def _estimate_audio_sizes(duration: float | None) -> dict[str, int]:
    if not duration:
        return {}
    sizes = {key: int(kbps * 1000 / 8 * duration) for key, kbps in AUDIO_BITRATES_KBPS.items()}
    sizes["wav"] = int(WAV_BITRATE_KBPS * 1000 / 8 * duration)
    return sizes


def get_video_info(url: str) -> dict:
    ydl_opts = {
        "quiet": True,
        "noplaylist": True,
        "skip_download": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    duration = info.get("duration")
    formats = info.get("formats") or []

    return {
        "title": info.get("title"),
        "duration": duration,
        "thumbnail": info.get("thumbnail"),
        "extractor": info.get("extractor"),
        "video_qualities": _video_qualities(formats, duration),
        "audio_sizes": _estimate_audio_sizes(duration),
        "uploader": info.get("uploader"),
    }


def download_video(url: str, height: int | None = None) -> tuple[Path, str]:
    file_id = uuid.uuid4().hex
    outtmpl = str(DOWNLOAD_DIR / f"{file_id}.%(ext)s")

    format_selector = f"bv*[height<={height}]+ba/b[height<={height}]" if height else "bv*+ba/b"

    ydl_opts = {
        "quiet": True,
        "noplaylist": True,
        "format": format_selector,
        "merge_output_format": "mp4",
        "outtmpl": outtmpl,
    }
    if settings.ffmpeg_location:
        ydl_opts["ffmpeg_location"] = settings.ffmpeg_location
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        file_path = _resolve_downloaded_path(ydl, info)

    download_name = sanitize_filename(info.get("title", "video")) + file_path.suffix
    return file_path, download_name


def download_audio(url: str, quality: str = "320") -> tuple[Path, str]:
    if quality not in AUDIO_QUALITIES:
        quality = "320"

    file_id = uuid.uuid4().hex
    outtmpl = str(DOWNLOAD_DIR / f"{file_id}.%(ext)s")

    codec = "wav" if quality == "wav" else "mp3"
    postprocessor = {"key": "FFmpegExtractAudio", "preferredcodec": codec}
    if codec == "mp3":
        postprocessor["preferredquality"] = quality

    ydl_opts = {
        "quiet": True,
        "noplaylist": True,
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "postprocessors": [postprocessor],
    }
    if settings.ffmpeg_location:
        ydl_opts["ffmpeg_location"] = settings.ffmpeg_location
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        original_path = Path(ydl.prepare_filename(info))

    ext = f".{codec}"
    file_path = original_path.with_suffix(ext)
    download_name = sanitize_filename(info.get("title", "audio")) + ext
    return file_path, download_name
