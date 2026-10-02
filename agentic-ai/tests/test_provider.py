import asyncio
from unittest.mock import AsyncMock

import pytest

from app.provider import invoke_model, quota_retry_seconds


def test_wrapper_without_cause_keeps_quota_and_delay():
    error = RuntimeError("429 RESOURCE_EXHAUSTED Please retry in 53.255985449s.")
    assert quota_retry_seconds(error) == 55
    assert quota_retry_seconds(RuntimeError("Invalid API key")) is None


def test_retry_preserves_failed_step_and_honors_provider_delay(monkeypatch):
    sleep = AsyncMock()
    monkeypatch.setattr("app.provider.asyncio.sleep", sleep)
    model = AsyncMock()
    model.ainvoke.side_effect = [
        RuntimeError("RESOURCE_EXHAUSTED Please retry in 50.8s."),
        "completed",
    ]
    assert asyncio.run(invoke_model(model, ["evidence"])) == "completed"
    sleep.assert_awaited_once_with(52)
    assert model.ainvoke.await_count == 2
    assert model.ainvoke.await_args_list[0] == model.ainvoke.await_args_list[1]


def test_persistent_quota_error_is_not_retried_indefinitely(monkeypatch):
    monkeypatch.setattr("app.provider.asyncio.sleep", AsyncMock())
    model = AsyncMock()
    model.ainvoke.side_effect = RuntimeError("RESOURCE_EXHAUSTED")
    with pytest.raises(RuntimeError):
        asyncio.run(invoke_model(model, []))
    assert model.ainvoke.await_count == 2
