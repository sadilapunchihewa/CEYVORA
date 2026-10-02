import httpx


class CeyvoraApiError(Exception):
    """A safe, user-independent error from the CEYVORA API."""


class CeyvoraApi:
    def __init__(
        self,
        base_url: str,
        timeout_seconds: float = 8,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self._client = httpx.AsyncClient(
            base_url=base_url,
            timeout=httpx.Timeout(timeout_seconds),
            headers={"Accept": "application/json"},
            follow_redirects=False,
            transport=transport,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def _get(self, path: str, params: dict | None = None):
        try:
            response = await self._client.get(path, params=params)
            response.raise_for_status()
            return response.json()
        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            raise CeyvoraApiError(
                "The CEYVORA catalogue is unavailable. Try again shortly."
            ) from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise CeyvoraApiError("That CEYVORA item could not be found.") from exc
            raise CeyvoraApiError(
                f"The CEYVORA catalogue returned HTTP {exc.response.status_code}."
            ) from exc
        except (ValueError, httpx.DecodingError) as exc:
            raise CeyvoraApiError(
                "The CEYVORA catalogue returned unreadable data."
            ) from exc

    async def search_destinations(
        self,
        search: str | None = None,
        province: str | None = None,
        district: str | None = None,
        featured: bool | None = None,
    ):
        params = {"page": 1, "pageSize": 12}
        for key, value in (
            ("search", search),
            ("province", province),
            ("district", district),
            ("featured", featured),
        ):
            if value is not None and value != "":
                params[key] = value
        return await self._get("/api/destinations", params)

    async def get_destination(self, slug: str):
        return await self._get(f"/api/destinations/slug/{slug}")

    async def search_tour_packages(
        self,
        search: str | None = None,
        destination_id: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        min_days: int | None = None,
        max_days: int | None = None,
        featured: bool | None = None,
    ):
        params = {"page": 1, "pageSize": 12}
        for key, value in (
            ("search", search),
            ("destinationId", destination_id),
            ("minPrice", min_price),
            ("maxPrice", max_price),
            ("minDays", min_days),
            ("maxDays", max_days),
            ("featured", featured),
        ):
            if value is not None and value != "":
                params[key] = value
        return await self._get("/api/tourpackages", params)

    async def get_tour_package(self, slug: str):
        return await self._get(f"/api/tourpackages/slug/{slug}")

    async def get_package_itinerary(self, package_id: int):
        return await self._get(f"/api/tourpackages/{package_id}/itinerary")

    async def get_journey_ideas(self):
        """Read the same published inspiration catalogue used by the Tours page."""
        data = await self._get("/api/content/journeys")
        return data.get("items", []) if isinstance(data, dict) else []
