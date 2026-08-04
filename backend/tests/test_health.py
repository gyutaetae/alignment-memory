from fastapi.testclient import TestClient

from alignment_memory.interfaces.api.main import create_app
from alignment_memory.settings import Settings


def test_healthz_reports_local_mode() -> None:
    app = create_app(Settings(app_mode="fixture", _env_file=None))

    with TestClient(app) as client:
        response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "alignment-memory",
        "mode": "fixture",
    }
