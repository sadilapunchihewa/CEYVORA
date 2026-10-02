import pytest
from pydantic import ValidationError

from app.schemas import PlannerRequest


def test_request_accepts_a_valid_trip():
    request = PlannerRequest(
        message="A relaxed week with wildlife and beaches",
        days=7,
        travellers=2,
        budget=1500,
        interests=["wildlife", "beaches"],
        pace="relaxed",
        mustVisit=["Galle"],
    )

    assert request.days == 7
    assert request.pace == "relaxed"
    assert request.mustVisit == ["Galle"]


@pytest.mark.parametrize(
    "payload",
    [
        {"message": "short"},
        {"message": "A Sri Lankan trip", "days": 0},
        {"message": "A Sri Lankan trip", "travellers": 21},
        {"message": "A Sri Lankan trip", "budget": -1},
        {"message": "A Sri Lankan trip", "pace": "extreme"},
        {"message": "A Sri Lankan trip", "unexpected": "field"},
    ],
)
def test_request_rejects_invalid_or_extra_input(payload):
    with pytest.raises(ValidationError):
        PlannerRequest(**payload)


def test_request_trims_text_and_bounds_lists():
    request = PlannerRequest(
        message="  Plan a small island holiday  ",
        interests=["  Culture ", "", "Wildlife"],
        mustVisit=[" Ella "],
    )

    assert request.message == "Plan a small island holiday"
    assert request.interests == ["Culture", "Wildlife"]
    assert request.mustVisit == ["Ella"]
