from pydantic import BaseModel


class VideoInfoRequest(BaseModel):
    url: str


class VideoQualityOption(BaseModel):
    height: int
    label: str
    size: int | None = None


class VideoInfoResponse(BaseModel):
    title: str
    duration: float | None = None
    thumbnail: str | None = None
    extractor: str
    uploader: str | None = None
    video_qualities: list[VideoQualityOption] = []
    audio_sizes: dict[str, int] = {}


class DownloadVideoRequest(BaseModel):
    url: str
    height: int | None = None


class DownloadAudioRequest(BaseModel):
    url: str
    quality: str = "320"
