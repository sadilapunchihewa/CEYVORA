import asyncio
import json

import httpx
import pytest
from langchain_core.messages import AIMessage

from app.agents.graph import create_journey_plan
from app.schemas import PlannerRequest, RouteDecision
from app.services.ceyvora_api import CeyvoraApi


class CountingModel:
    def __init__(self, include_tours: bool):
        self.include_tours = include_tours
        self.calls = 0
        self.composer_evidence = None

    def with_structured_output(self, schema):
        model = self

        class Structured:
            async def ainvoke(self, _messages, **kwargs):
                assert kwargs["automatic_function_calling"]["disable"] is True
                model.calls += 1
                if schema is RouteDecision:
                    return RouteDecision(
                        destination_task="Find Jaffna.",
                        tour_task="Find a Jaffna package." if model.include_tours else None,
                    )
                model.composer_evidence = json.loads(_messages[-1].content)["verified_catalogue_evidence"]
                return schema(
                    title="A short Jaffna escape",
                    summary="A relaxed cultural visit based on CEYVORA places.",
                    itinerary=[
                        {
                            "day": 1,
                            "destination": "Jaffna",
                            "destinationSlug": "jaffna",
                            "title": "Explore Jaffna",
                            "description": "Take time to explore the verified destination.",
                        }
                    ],
                )

        return Structured()

    def bind_tools(self, tools):
        model = self
        selected = tools[0]

        class Bound:
            async def ainvoke(self, _messages, **kwargs):
                assert kwargs["automatic_function_calling"]["disable"] is True
                model.calls += 1
                arguments = {"search": "Jaffna"}
                return AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "name": selected.name,
                            "args": arguments,
                            "id": f"call-{model.calls}",
                        }
                    ],
                )

        return Bound()


@pytest.mark.parametrize(
    ("include_tours", "expected_calls"), [(False, 3), (True, 4)]
)
def test_plan_stays_within_four_gemini_invocations(include_tours, expected_calls):
    async def handler(request: httpx.Request):
        if request.url.path == "/api/destinations":
            return httpx.Response(
                200,
                json={
                    "items": [
                        {
                            "id": 7,
                            "name": "Jaffna",
                            "slug": "jaffna",
                            "shortDescription": "Northern Sri Lanka.",
                            "description": "A verified destination.",
                            "district": "Jaffna",
                            "province": "Northern Province",
                        }
                    ]
                },
            )
        if request.url.path == "/api/content/journeys":
            return httpx.Response(200, json={"items": [{"name": "Travel like a local", "slug": "travel-like-a-local", "route": ["colombo", "jaffna"], "image": "/images/local.jpg"}]})
        return httpx.Response(200, json={"items": []})

    async def run():
        api = CeyvoraApi(
            "http://ceyvora.test", transport=httpx.MockTransport(handler)
        )
        model = CountingModel(include_tours)
        try:
            result = await create_journey_plan(
                PlannerRequest(
                    message="Plan a relaxed two-day cultural visit to Jaffna.",
                    days=2,
                    travellers=2,
                ),
                api,
                model,
            )
            return result, model.calls, model.composer_evidence
        finally:
            await api.close()

    result, calls, evidence = asyncio.run(run())
    assert calls == expected_calls
    assert calls <= 4
    assert result["itinerary"][0]["destination"] == "Jaffna"
    assert len(result["itinerary"]) == 2

    assert evidence["journey_ideas"][0]["slug"] == "travel-like-a-local"
    assert "image" not in evidence["journey_ideas"][0]
    assert result["matchedTour"] is None
