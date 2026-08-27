import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Farm Direct API"
    DATABASE_URL: str = os.getenv()

    class Config:
        case_sensitive = True

settings = Settings()