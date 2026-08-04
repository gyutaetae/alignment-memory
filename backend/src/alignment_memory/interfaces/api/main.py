from fastapi import FastAPI

from alignment_memory.settings import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or get_settings()
    app = FastAPI(title=app_settings.app_name, version="0.1.0")
    app.state.settings = app_settings

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict[str, str]:
        return {
            "status": "ok",
            "service": "alignment-memory",
            "mode": app_settings.app_mode,
        }

    return app
