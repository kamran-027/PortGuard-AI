from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "PortGuard AI Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Ollama settings
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "gemma4:12b"
    OLLAMA_FALLBACK_MODELS: List[str] = ["gemma2:9b", "gemma:7b", "mistral:latest"]
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Demurrage rates (Standard port rates: Nhava Sheva / JNPT / Mundra)
    DEMURRAGE_DAILY_RATE_USD_20FT: float = 175.0
    DEMURRAGE_DAILY_RATE_USD_40FT: float = 320.0
    USD_TO_INR_RATE: float = 84.0
    CUSTOMS_MISDECLARATION_PENALTY_PERCENT: float = 0.05  # 5% of consignment value under Customs Act

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
