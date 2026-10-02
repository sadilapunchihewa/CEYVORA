import asyncio
import math
import re


def quota_retry_seconds(error: Exception) -> int | None:
    """Recognize wrapped SDK errors, including wrappers without a cause."""
    current = error
    visited = set()
    while current is not None and id(current) not in visited:
        visited.add(id(current))
        message = str(current)
        if (
            str(getattr(current, "code", "")) == "429"
            or str(getattr(current, "status", "")).upper() == "RESOURCE_EXHAUSTED"
            or "RESOURCE_EXHAUSTED" in message
            or re.search(r"\b429\b", message)
        ):
            delay = re.search(r"(?:retry in\s+|retryDelay['\"]?\s*:\s*['\"]?)(\d+(?:\.\d+)?)s", message, re.I)
            return max(1, math.ceil(float(delay.group(1))) + 1) if delay else 60
        current = current.__cause__ or current.__context__
    return None


async def invoke_model(model, messages):
    # LangGraph executes the tools itself; SDK AFC would add hidden model calls.
    options = {"automatic_function_calling": {"disable": True}}
    try:
        return await model.ainvoke(messages, **options)
    except Exception as error:
        delay = quota_retry_seconds(error)
        if delay is None or delay > 60:
            raise
        # Retry only this step, preserving the catalogue evidence already gathered.
        await asyncio.sleep(delay)
        return await model.ainvoke(messages, **options)
