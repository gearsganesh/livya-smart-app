from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://livya:livya@localhost:5432/livya"
    cors_origins: list[str] = ["http://localhost:8081", "http://localhost:19006"]
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
