from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://livya:livya@localhost:5432/livya"
    cors_origins: list[str] = ["http://localhost:8081", "http://localhost:19006"]
    supabase_url: str = ""
    supabase_publishable_key: str = ""

    ollama_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2:3b"
    whisper_url: str = "http://127.0.0.1:9000"
    ai_min_timeout_seconds: float = 15.0
    ai_max_timeout_seconds: float = 90.0
    ai_max_text_chars: int = 20_000
    ai_max_audio_bytes: int = 6_000_000
    ai_max_request_bytes: int = 9_000_000

    allow_external_ai_fallback: bool = False
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-5.6-luna"
    anthropic_api_key: str = ""
    anthropic_base_url: str = "https://api.anthropic.com"
    anthropic_model: str = "claude-sonnet-5"

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    revenuecat_webhook_secret: str = ""

    require_https: bool = True
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
