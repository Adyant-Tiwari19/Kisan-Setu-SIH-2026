import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Farm Direct API"
    DATABASE_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",env_file_encoding="utf-8", extra="ignore",case_sensitive=True
    )

settings = Settings()