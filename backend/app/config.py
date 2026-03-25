from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str = "mysql+pymysql://root:password@localhost:3306/bms"

    # Firebase
    firebase_project_id: str
    firebase_service_account_path: str = "firebase-service-account.json"

    # SendGrid
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@cakewjoy.com"
    sendgrid_from_name: str = "Cake with Joy"

    # App
    frontend_url: str = "http://localhost:3000"
    debug: bool = False


settings = Settings()
