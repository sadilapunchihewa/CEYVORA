from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PlannerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=8, max_length=3000)
    days: int | None = Field(default=None, ge=1, le=30)
    travellers: int | None = Field(default=None, ge=1, le=20)
    budget: float | None = Field(default=None, ge=0, le=10_000_000)
    interests: list[str] = Field(default_factory=list, max_length=12)
    pace: Literal["relaxed", "balanced", "active"] = "balanced"
    mustVisit: list[str] = Field(default_factory=list, max_length=12)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 8:
            raise ValueError("Tell us a little more about the journey you want.")
        return value

    @field_validator("interests", "mustVisit")
    @classmethod
    def clean_lists(cls, values: list[str]) -> list[str]:
        return [item.strip()[:80] for item in values if item.strip()][:12]

class RouteDecision(BaseModel):
    destination_task: str = Field(
        default="Search the CEYVORA destination catalogue for verified places that fit this trip.",
        max_length=600,
    )
    tour_task: str | None = Field(default=None, max_length=600)
    reason: str = Field(default="", max_length=240)


class PlannedDay(BaseModel):
    day: int = Field(ge=1, le=30)
    destination: str = Field(min_length=1, max_length=100)
    destinationSlug: str | None = Field(default=None, max_length=180)
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=700)
    sourceType: Literal["destination", "tour", "suggestion"] = "suggestion"
    sourceId: int | None = None


class MatchedTour(BaseModel):
    id: int
    slug: str
    name: str
    startingPrice: float
    currency: str
    durationDays: int


class PlannerResponse(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    summary: str = Field(min_length=1, max_length=1000)
    days: int = Field(ge=1, le=30)
    travellers: int = Field(ge=1, le=20)
    matchedTour: MatchedTour | None = None
    itinerary: list[PlannedDay] = Field(min_length=1, max_length=30)
    reasons: list[str] = Field(default_factory=list, max_length=8)
    warnings: list[str] = Field(default_factory=list, max_length=8)
    workersConsulted: list[str] = Field(default_factory=list, max_length=2)
    delegations: int = Field(ge=0, le=4)
