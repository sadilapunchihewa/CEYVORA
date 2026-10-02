"""Manual live sample: python -m tests.run_sample_plan (uses configured API)."""
import json
import logging
import time
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def main():
    logging.disable(logging.CRITICAL)
    request = {
        "message": "Plan a relaxed two-day cultural visit to Jaffna for two travellers. Use verified CEYVORA destinations.",
        "days": 2,
        "travellers": 2,
        "interests": ["culture", "local food"],
        "pace": "relaxed",
        "mustVisit": ["Jaffna"],
    }
    Path("tests/sample-jaffna-request.json").write_text(json.dumps(request, indent=2))
    started = time.monotonic()
    with TestClient(app) as client:
        response = client.post("/plan", json=request)
    result = {
        "model": settings.gemini_model,
        "status": response.status_code,
        "elapsedSeconds": round(time.monotonic() - started, 2),
        "retryAfter": response.headers.get("retry-after"),
        "body": response.json(),
    }
    Path("tests/sample-jaffna-result.json").write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
