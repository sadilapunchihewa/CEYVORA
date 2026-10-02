import json
from typing import Any, Literal, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.language_models import BaseChatModel
from langgraph.graph import END, START, StateGraph

from app.prompts.planner import (
    COMPOSER_SYSTEM,
    DESTINATION_WORKER_SYSTEM,
    SUPERVISOR_SYSTEM,
    TOUR_WORKER_SYSTEM,
)
from app.provider import invoke_model
from app.schemas import (
    MatchedTour,
    PlannedDay,
    PlannerRequest,
    PlannerResponse,
    RouteDecision,
)
from app.services.ceyvora_api import CeyvoraApi, CeyvoraApiError
from app.tools.catalogue_tools import build_destination_tools, build_tour_tools

MAX_DELEGATIONS = 2
MAX_WORKER_TOOL_CALLS = 4


class PlannerState(TypedDict, total=False):
    request: dict
    destination_task: str
    tour_task: str
    reports: dict[str, str]
    consulted: list[str]
    delegations: int
    destination_evidence: list[dict]
    tour_evidence: list[dict]
    result: dict


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _evidence_destinations(events: list[dict]) -> list[dict]:
    found: dict[str, dict] = {}
    for event in events:
        data = event.get("data", {})
        if not isinstance(data, dict):
            continue
        for item in data.get("items", []):
            if isinstance(item, dict) and item.get("slug") and item.get("name"):
                found[item["slug"]] = item
        for item in data.get("destinations", []):
            if isinstance(item, dict) and item.get("slug") and item.get("name"):
                found[item["slug"]] = item
    return list(found.values())


def _evidence_tours(events: list[dict]) -> list[dict]:
    found: dict[str, dict] = {}
    for event in events:
        data = event.get("data", {})
        if not isinstance(data, dict):
            continue
        for item in data.get("items", []):
            if isinstance(item, dict) and item.get("slug") and item.get("id"):
                found[item["slug"]] = item
    return list(found.values())


def _evidence_itineraries(events: list[dict]) -> dict[int, list[dict]]:
    result: dict[int, list[dict]] = {}
    for event in events:
        data = event.get("data", {})
        if not isinstance(data, dict):
            continue
        for package in data.get("items", []):
            if not isinstance(package, dict):
                continue
            package_id = package.get("id")
            rows = data.get("itineraryDays", [])
            if isinstance(rows, dict):
                rows = rows.get("items", [])
            if package_id and rows:
                result[package_id] = rows
        for row in data.get("items", []):
            if isinstance(row, dict) and row.get("tourPackageId"):
                result.setdefault(row["tourPackageId"], []).append(row)
    return result


def _normal(value: str | None) -> str:
    return " ".join((value or "").casefold().replace("-", " ").split())


def build_planner_graph(model: BaseChatModel, api: CeyvoraApi):
    async def supervise(state: PlannerState) -> dict:
        request = state["request"]
        prompt = {
            "traveller_request": request,
            "routing_instruction": "In one response, assign a destination task and optionally a tour task. Keep each task short.",
        }
        decision: RouteDecision = await invoke_model(model.with_structured_output(RouteDecision),
            [SystemMessage(content=SUPERVISOR_SYSTEM), HumanMessage(content=_json(prompt))]
        )
        return {
            "destination_task": decision.destination_task,
            "tour_task": decision.tour_task,
        }

    async def run_worker(
        state: PlannerState,
        worker: str,
        system_prompt: str,
        evidence_key: str,
        tool_factory,
        task_key: str,
    ) -> dict:
        evidence: list[dict] = []
        tools = tool_factory(api, evidence)
        tool_map = {tool.name: tool for tool in tools}
        task = state.get(task_key, "") or "Research destinations for this trip request."
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Assigned task: {task}\nTrip request facts: {_json(state['request'])}"),
        ]
        model_with_tools = model.bind_tools(tools)
        reply: AIMessage = await invoke_model(model_with_tools, messages)
        calls = (getattr(reply, "tool_calls", []) or [])[:MAX_WORKER_TOOL_CALLS]
        for call in calls:
            selected_tool = tool_map.get(call.get("name"))
            if selected_tool is None:
                continue
            try:
                await selected_tool.ainvoke(call.get("args", {}))
            except Exception:
                # Catalogue tool failures are captured as evidence by the tool itself.
                continue

        # Reports are operational summaries only. Never retain model tool-call transcripts.
        reports = dict(state.get("reports", {}))
        reports[worker] = (
            "Read-only catalogue tools were called; use only the separately supplied verified records."
            if calls
            else "No catalogue tool was called; no facts were verified."
        )
        consulted = list(state.get("consulted", []))
        consulted.append(worker)
        return {
            "reports": reports,
            "consulted": consulted,
            "delegations": len(consulted),
            evidence_key: evidence,
        }

    async def research_destinations(state: PlannerState) -> dict:
        return await run_worker(
            state,
            "destination_researcher",
            DESTINATION_WORKER_SYSTEM,
            "destination_evidence",
            build_destination_tools,
            "destination_task",
        )

    async def research_tours(state: PlannerState) -> dict:
        return await run_worker(
            state,
            "tour_researcher",
            TOUR_WORKER_SYSTEM,
            "tour_evidence",
            build_tour_tools,
            "tour_task",
        )

    async def compose(state: PlannerState) -> dict:
        request = state["request"]
        destination_events = state.get("destination_evidence", [])
        tour_events = state.get("tour_evidence", [])
        verified_destinations = _evidence_destinations(destination_events)
        verified_tours = _evidence_tours(tour_events)
        verified_itineraries = _evidence_itineraries(tour_events)
        journey_catalogue_unavailable = False
        try:
            journey_ideas = await api.get_journey_ideas()
        except CeyvoraApiError:
            journey_ideas = []
            journey_catalogue_unavailable = True
        # Inspiration is separate from priced packages. Omit image URLs and
        # other presentation fields to keep the model context compact.
        journey_ideas = [
            {key: item[key] for key in
             ("name", "slug", "category", "description", "heading", "route", "advice")
             if key in item}
            for item in journey_ideas[:500]
            if isinstance(item, dict) and item.get("slug") and item.get("name")
        ]
        evidence = {
            "destinations": verified_destinations,
            "tours": verified_tours,
            "journey_ideas": journey_ideas,
            "saved_itineraries_by_package_id": verified_itineraries,
            "worker_reports": state.get("reports", {}),
        }

        from pydantic import BaseModel, Field

        # Keep the generation schema small. Source metadata is assigned below
        # from verified records, and the public response validates all bounds.
        class DraftDay(BaseModel):
            day: int
            destination: str
            destinationSlug: str | None = None
            title: str
            description: str

        class Draft(BaseModel):
            title: str
            summary: str
            itinerary: list[DraftDay]
            matchedTourSlug: str | None = None
            reasons: list[str] = Field(default_factory=list)
            warnings: list[str] = Field(default_factory=list)

        draft: Draft = await invoke_model(model.with_structured_output(Draft),
            [
                SystemMessage(content=COMPOSER_SYSTEM),
                HumanMessage(
                    content=_json(
                        {
                            "traveller_request": request,
                            "verified_catalogue_evidence": evidence,
                            "instruction": "Return only a plan grounded in this evidence. If there are no verified destination records, do not name a destination; use a generic day and explain the unavailable catalogue.",
                        }
                    )
                ),
            ]
        )

        warnings = list(draft.warnings)
        if journey_catalogue_unavailable:
            warnings.append("Journey inspiration could not be loaded from the Tours catalogue.")
        if not verified_destinations:
            warnings.append(
                "The CEYVORA destination catalogue did not return verified places for this request."
            )

        by_name = {_normal(place.get("name")): place for place in verified_destinations}
        by_slug = {place.get("slug"): place for place in verified_destinations}
        tour_by_slug = {tour.get("slug"): tour for tour in verified_tours}

        matched_raw = tour_by_slug.get(draft.matchedTourSlug or "")
        matched_tour = None
        if matched_raw:
            matched_tour = MatchedTour(
                id=matched_raw["id"],
                slug=matched_raw["slug"],
                name=matched_raw.get("title") or matched_raw.get("name") or "CEYVORA tour",
                startingPrice=float(matched_raw.get("startingPrice", 0)),
                currency=matched_raw.get("currency", "USD"),
                durationDays=int(matched_raw.get("durationDays", 1)),
            )
        elif draft.matchedTourSlug:
            warnings.append("A suggested tour could not be matched to a verified CEYVORA package.")

        itinerary: list[PlannedDay] = []
        expected_days = request.get("days") or len(draft.itinerary)
        saved_rows = verified_itineraries.get(matched_raw.get("id"), []) if matched_raw else []
        for index, raw_day in enumerate(draft.itinerary[:expected_days], start=1):
            place = by_slug.get(raw_day.destinationSlug or "") or by_name.get(
                _normal(raw_day.destination)
            )
            if raw_day.destinationSlug and place is None:
                warnings.append("An unverified destination suggestion was removed from the route.")

            if place is None and verified_destinations:
                # Keep route links grounded. A named model-only place is never exposed.
                place = None
                destination_name = "Flexible travel day"
                destination_slug = None
                source_id = None
                source_type = "suggestion"
            elif place:
                destination_name = place["name"]
                destination_slug = place["slug"]
                source_id = place.get("id")
                source_type = "destination"
            else:
                destination_name = "Flexible travel day"
                destination_slug = None
                source_id = None
                source_type = "suggestion"

            saved = next(
                (
                    row for row in saved_rows
                    if row.get("dayNumber") == raw_day.day
                    and _normal(row.get("title")) == _normal(raw_day.title)
                ),
                None,
            )
            if saved:
                source_type = "tour"
                source_id = matched_raw["id"]
                raw_day = raw_day.model_copy(
                    update={
                        "title": saved["title"],
                        "description": saved["description"],
                    }
                )
            itinerary.append(
                PlannedDay(
                    day=index,
                    destination=destination_name,
                    destinationSlug=destination_slug,
                    title=raw_day.title,
                    description=raw_day.description,
                    sourceType=source_type,
                    sourceId=source_id,
                )
            )

        if request.get("days") and len(itinerary) < expected_days:
            warnings.append(
                "Some requested days are left open for flexibility because the available catalogue evidence was limited."
            )
            for index in range(len(itinerary) + 1, expected_days + 1):
                itinerary.append(
                    PlannedDay(
                        day=index,
                        destination="Flexible travel day",
                        title="Leave room to explore",
                        description="Keep this day open and confirm transport and activities while planning your trip.",
                        sourceType="suggestion",
                    )
                )
        if not verified_tours and any(
            event.get("data", {}).get("error") for event in tour_events
        ):
            warnings.append("Tour details could not be verified from the CEYVORA API.")

        response = PlannerResponse(
            title=draft.title,
            summary=draft.summary,
            days=len(itinerary),
            travellers=request.get("travellers") or 1,
            matchedTour=matched_tour,
            itinerary=itinerary,
            reasons=draft.reasons,
            warnings=list(dict.fromkeys(warnings))[:8],
            workersConsulted=list(dict.fromkeys(state.get("consulted", []))),
            delegations=state.get("delegations", 0),
        )
        return {"result": response.model_dump(by_alias=True)}

    async def research(state: PlannerState) -> dict:
        reports = dict(state.get("reports", {}))
        consulted = list(state.get("consulted", []))
        destination_result = await research_destinations(state)
        reports.update(destination_result.get("reports", {}))
        consulted.extend(destination_result.get("consulted", []))
        tour_evidence = state.get("tour_evidence", [])
        tour_task = state.get("tour_task")
        if tour_task:
            intermediate = {
                **state,
                "reports": reports,
                "consulted": consulted,
                "destination_evidence": destination_result.get(
                    "destination_evidence", state.get("destination_evidence", [])
                ),
            }
            tour_result = await research_tours(intermediate)
            reports.update(tour_result.get("reports", {}))
            consulted.extend(tour_result.get("consulted", []))
            tour_evidence = tour_result.get("tour_evidence", tour_evidence)
        return {
            "reports": reports,
            "consulted": consulted,
            "delegations": len(consulted),
            "destination_evidence": destination_result.get(
                "destination_evidence", state.get("destination_evidence", [])
            ),
            "tour_evidence": tour_evidence,
        }

    graph = StateGraph(PlannerState)
    graph.add_node("supervisor", supervise)
    graph.add_node("research", research)
    graph.add_node("compose", compose)
    graph.add_edge(START, "supervisor")
    graph.add_edge("supervisor", "research")
    graph.add_edge("research", "compose")
    graph.add_edge("compose", END)
    return graph.compile()


async def create_journey_plan(request: PlannerRequest, api: CeyvoraApi, model: BaseChatModel):
    graph = build_planner_graph(model, api)
    state: PlannerState = {
        "request": request.model_dump(by_alias=True),
        "reports": {},
        "consulted": [],
        "delegations": 0,
        "destination_evidence": [],
        "tour_evidence": [],
    }
    result = await graph.ainvoke(
        state,
        config={"recursion_limit": MAX_DELEGATIONS * 3 + 6},
    )
    return result["result"]
