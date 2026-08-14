from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    allowed_origins: str = "http://localhost:5173"
    download_dir: str = "downloads"
    ffmpeg_location: str | None = None
    cookies_file: str | None = None
    rapidapi_key: str | None = None
    rapidapi_key_2: str | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def rapidapi_keys(self) -> list[str]:
        return [key for key in (self.rapidapi_key, self.rapidapi_key_2) if key]


settings = Settings()
