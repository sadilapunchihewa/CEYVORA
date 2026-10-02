import json
import re
from typing import Any
from urllib.parse import quote

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, ConfigDict, Field

from app.services.ceyvora_api import CeyvoraApi, CeyvoraApiError

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class DestinationSearch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    search: str | None = Field(default=None, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    featured: bool | None = None


class SlugInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class TourSearch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    search: str | None = Field(default=None, max_length=100)
    destination_id: int | None = Field(default=None, ge=1)
    min_price: float | None = Field(default=None, ge=0, le=10_000_000)
    max_price: float | None = Field(default=None, ge=0, le=10_000_000)
    min_days: int | None = Field(default=None, ge=1, le=365)
    max_days: int | None = Field(default=None, ge=1, le=365)
    featured: bool | None = None


class PackageIdInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    package_id: int = Field(ge=1)


def _compact(value: Any, kind: str):
    """Return only public planning facts; keep tool payloads bounded."""
    if isinstance(value, list):
        items = value
        wrapper = {}
    elif isinstance(value, dict) and isinstance(value.get("items"), list):
        items = value["items"]
        wrapper = {
            key: value[key]
            for key in ("page", "pageSize", "totalItems", "totalPages")
            if key in value
        }
    else:
        items = [value]
        wrapper = {}

    if kind == "destination":
        fields = (
            "id", "name", "slug", "shortDescription", "description",
            "district", "province", "isFeatured", "isActive",
        )
    elif kind == "tour":
        fields = (
            "id", "title", "name", "slug", "shortDescription", "description",
            "durationDays", "durationNights", "startingPrice", "currency",
            "isFeatured", "isActive",
        )
    elif kind == "itinerary":
        fields = (
            "id", "tourPackageId", "dayNumber", "title", "description",
            "accommodation", "meals",
        )
    else:
        fields = ()

    compact = [
        {
            field: (
                item[field][:700]
                if field == "description" and isinstance(item[field], str)
                else item[field][:360]
                if field == "shortDescription" and isinstance(item[field], str)
                else item[field]
            )
            for field in fields
            if field in item
        }
        for item in items[:12]
        if isinstance(item, dict)
    ]

    # Package details embed related records; retain only their verified names/slugs.
    if kind == "tour" and isinstance(value, dict):
        if isinstance(value.get("destinations"), list):
            wrapper["destinations"] = [
                {key: item[key] for key in ("id", "name", "slug") if key in item}
                for item in value["destinations"][:20]
                if isinstance(item, dict)
            ]
        if isinstance(value.get("itineraryDays"), list):
            wrapper["itineraryDays"] = _compact(value["itineraryDays"], "itinerary")
    return {**wrapper, "items": compact}


def _safe_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _record(evidence: list[dict], tool_name: str, value: Any) -> str:
    evidence.append({"tool": tool_name, "data": value})
    return _safe_json(value)


def build_destination_tools(api: CeyvoraApi, evidence: list[dict]):
    async def search_destinations(
        search: str | None = None,
        province: str | None = None,
        district: str | None = None,
        featured: bool | None = None,
    ) -> str:
        """Search real active CEYVORA destinations by name, interest or region."""
        try:
            result = await api.search_destinations(search, province, district, featured)
            return _record(evidence, "search_destinations", _compact(result, "destination"))
        except CeyvoraApiError as exc:
            return _record(evidence, "search_destinations", {"ok": False, "error": str(exc)})

    async def get_destination(slug: str) -> str:
        """Read a real CEYVORA destination by its URL slug."""
        if not SLUG_PATTERN.fullmatch(slug):
            return _record(evidence, "get_destination", {"ok": False, "error": "Use a valid destination slug."})
        try:
            result = await api.get_destination(quote(slug, safe="-"))
            return _record(evidence, "get_destination", _compact(result, "destination"))
        except CeyvoraApiError as exc:
            return _record(evidence, "get_destination", {"ok": False, "error": str(exc)})

    return [
        StructuredTool.from_function(
            coroutine=search_destinations,
            name="search_destinations",
            description="Search the live CEYVORA catalogue for active destinations. Use traveller interests or must-visit place names as search terms.",
            args_schema=DestinationSearch,
        ),
        StructuredTool.from_function(
            coroutine=get_destination,
            name="get_destination",
            description="Fetch verified details for one active CEYVORA destination using its slug.",
            args_schema=SlugInput,
        ),
    ]


def build_tour_tools(api: CeyvoraApi, evidence: list[dict]):
    async def search_tour_packages(
        search: str | None = None,
        destination_id: int | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        min_days: int | None = None,
        max_days: int | None = None,
        featured: bool | None = None,
    ) -> str:
        """Search actual active CEYVORA tour packages and their published prices."""
        if min_price is not None and max_price is not None and min_price > max_price:
            return _record(evidence, "search_tour_packages", {"ok": False, "error": "Minimum price cannot exceed maximum price."})
        if min_days is not None and max_days is not None and min_days > max_days:
            return _record(evidence, "search_tour_packages", {"ok": False, "error": "Minimum days cannot exceed maximum days."})
        try:
            result = await api.search_tour_packages(
                search, destination_id, min_price, max_price, min_days, max_days, featured
            )
            return _record(evidence, "search_tour_packages", _compact(result, "tour"))
        except CeyvoraApiError as exc:
            return _record(evidence, "search_tour_packages", {"ok": False, "error": str(exc)})

    async def get_tour_package(slug: str) -> str:
        """Fetch a CEYVORA tour, linked destinations, official starting price and saved itinerary."""
        if not SLUG_PATTERN.fullmatch(slug):
            return _record(evidence, "get_tour_package", {"ok": False, "error": "Use a valid tour slug."})
        try:
            result = await api.get_tour_package(quote(slug, safe="-"))
            return _record(evidence, "get_tour_package", _compact(result, "tour"))
        except CeyvoraApiError as exc:
            return _record(evidence, "get_tour_package", {"ok": False, "error": str(exc)})

    async def get_package_itinerary(package_id: int) -> str:
        """Read the saved day-by-day itinerary for an existing CEYVORA package ID."""
        try:
            result = await api.get_package_itinerary(package_id)
            return _record(evidence, "get_package_itinerary", _compact(result, "itinerary"))
        except CeyvoraApiError as exc:
            return _record(evidence, "get_package_itinerary", {"ok": False, "error": str(exc)})

    return [
        StructuredTool.from_function(
            coroutine=search_tour_packages,
            name="search_tour_packages",
            description="Search live CEYVORA packages. Supports name, destination ID, published price range, duration and featured status.",
            args_schema=TourSearch,
        ),
        StructuredTool.from_function(
            coroutine=get_tour_package,
            name="get_tour_package",
            description="Fetch a real CEYVORA tour by slug, including linked destinations and saved itinerary details.",
            args_schema=SlugInput,
        ),
        StructuredTool.from_function(
            coroutine=get_package_itinerary,
            name="get_package_itinerary",
            description="Fetch the existing itinerary rows for a package after verifying its package ID.",
            args_schema=PackageIdInput,
        ),
    ]
