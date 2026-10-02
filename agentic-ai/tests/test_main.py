from fastapi.testclient import TestClient

from app.main import app


def test_wrapped_quota_error_returns_429(monkeypatch):
    from unittest.mock import AsyncMock
    from app.main import _request_times

    _request_times.clear()
    monkeypatch.setattr(
        "app.main.create_journey_plan",
        AsyncMock(side_effect=RuntimeError("429 RESOURCE_EXHAUSTED Please retry in 48.2s.")),
    )
    with TestClient(app) as client:
        app.state.model = object()
        response = client.post("/plan", json={"message": "Visit Jaffna"})
    _request_times.clear()
    assert response.status_code == 429
    assert response.headers["Retry-After"] == "50"
    assert "RESOURCE_EXHAUSTED" not in response.text


def test_health_does_not_expose_credentials():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "api_key" not in body
    assert "GEMINI_API_KEY" not in body


def test_plan_explains_missing_gemini_configuration_safely():
    with TestClient(app) as client:
        app.state.model = None
        response = client.post("/plan", json={"message": "A week of quiet beaches"})

    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]
