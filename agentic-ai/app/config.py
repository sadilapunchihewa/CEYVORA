from dataclasses import dataclass
import os

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    ceyvora_api_base_url: str = os.getenv(
        "CEYVORA_API_BASE_URL", "http://localhost:5111"
    ).rstrip("/")
    frontend_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS", "http://localhost:5173"
        ).split(",")
        if origin.strip()
    )
    request_timeout_seconds: float = float(
        os.getenv("CEYVORA_API_TIMEOUT_SECONDS", "8")
    )
    max_plans_per_minute: int = int(os.getenv("MAX_PLANS_PER_MINUTE", "1"))


settings = Settings()
