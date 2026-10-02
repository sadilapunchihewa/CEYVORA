import asyncio
from collections import defaultdict, deque
from contextlib import asynccontextmanager
import logging
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from google.genai.errors import ServerError
from langchain_google_genai import ChatGoogleGenerativeAI

from app.provider import quota_retry_seconds
from app.config import settings
from app.schemas import PlannerRequest
from app.services.ceyvora_api import CeyvoraApi
from app.agents.graph import create_journey_plan

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ceyvora.agentic_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = None
    if settings.gemini_api_key:
        app.state.model = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0,
            # Google recommends exponential-backoff retries for 503/5xx responses.
            max_retries=4,
            timeout=45,
        )
    yield


app = FastAPI(
    title="CEYVORA AI Journey Planner",
    version="1.0.0",
    description="Read-only, catalogue-grounded Sri Lanka trip planning.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_request_times: dict[str, deque[float]] = defaultdict(deque)


def _enforce_rate_limit(request: Request) -> None:
    address = request.client.host if request.client else "unknown"
    now = time.monotonic()
    recent = _request_times[address]
    while recent and now - recent[0] >= 60:
        recent.popleft()
    # The free Gemini tier permits five model requests/minute. One plan uses
    # at most four, so allow one plan per client per rolling minute by default.
    if len(recent) >= settings.max_plans_per_minute:
        raise HTTPException(
            status_code=429,
            detail="Please wait a minute before planning another journey.",
            headers={"Retry-After": "60"},
        )
    recent.append(now)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "geminiConfigured": app.state.model is not None,
        "catalogueBaseUrl": settings.ceyvora_api_base_url,
    }


@app.post("/plan")
async def plan(request: PlannerRequest, http_request: Request):
    _enforce_rate_limit(http_request)
    model = app.state.model
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="The journey planner needs a Gemini API key. Set GEMINI_API_KEY in agentic-ai/.env and restart it.",
        )

    api = CeyvoraApi(
        settings.ceyvora_api_base_url, settings.request_timeout_seconds
    )
    try:
        async with asyncio.timeout(180):
            return await create_journey_plan(request, api, model)
    except TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="The planner took too long. Try a shorter request or try again shortly.",
        ) from exc
    except ServerError as exc:
        provider_code = getattr(exc, "code", None)
        provider_status = getattr(exc, "status", None)
        logger.warning(
            "Gemini temporarily unavailable (provider_code=%s; provider_status=%s)",
            provider_code,
            provider_status,
        )
        raise HTTPException(
            status_code=503,
            detail="Gemini is temporarily unavailable. Please try again in a moment.",
            headers={"Retry-After": "10"},
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        # Do not echo provider errors, request contents, or secrets to the client.
        cause = exc
        provider_code = None
        provider_status = None
        visited: set[int] = set()
        while cause is not None and id(cause) not in visited:
            visited.add(id(cause))
            provider_code = provider_code or getattr(cause, "code", None)
            provider_status = provider_status or getattr(cause, "status", None)
            cause = cause.__cause__ or cause.__context__
        logger.error(
            "Journey planning failed (%s; provider_code=%s; provider_status=%s)",
            type(exc).__name__,
            provider_code,
            provider_status,
        )
        retry_seconds = quota_retry_seconds(exc)
        if retry_seconds is not None:
            raise HTTPException(
                status_code=429,
                detail="Gemini request quota is temporarily exhausted. Wait about a minute, then try again.",
                headers={"Retry-After": str(retry_seconds)},
            ) from exc
        raise HTTPException(
            status_code=502,
            detail="The planner could not finish this request. Please try again shortly.",
        ) from exc
    finally:
        await api.close()
