import httpx
import asyncio

from app.services.ceyvora_api import CeyvoraApi


def test_tools_use_existing_backend_routes_and_parameter_names():
    observed = []

    async def handler(request: httpx.Request):
        observed.append(request)
        return httpx.Response(200, json={"items": [], "page": 1, "pageSize": 12})

    async def exercise_api():
        api = CeyvoraApi(
            "http://ceyvora.test",
            transport=httpx.MockTransport(handler),
        )
        try:
            await api.search_destinations(search="wildlife", province="Southern Province")
            await api.search_tour_packages(
                search="coast", destination_id=3, max_price=2000, min_days=5, max_days=9
            )
            await api.get_destination("galle")
            await api.get_tour_package("wild-sri-lanka")
            await api.get_package_itinerary(4)
        finally:
            await api.close()

    asyncio.run(exercise_api())

    assert observed[0].url.path == "/api/destinations"
    assert observed[0].url.params["search"] == "wildlife"
    assert observed[0].url.params["province"] == "Southern Province"
    assert observed[0].url.params["pageSize"] == "12"
    assert observed[1].url.path == "/api/tourpackages"
    assert observed[1].url.params["destinationId"] == "3"
    assert observed[1].url.params["maxPrice"] == "2000"
    assert observed[1].url.params["minDays"] == "5"
    assert observed[2].url.path == "/api/destinations/slug/galle"
    assert observed[3].url.path == "/api/tourpackages/slug/wild-sri-lanka"
    assert observed[4].url.path == "/api/tourpackages/4/itinerary"
