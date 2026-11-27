"""Application CRUD + submission routes."""

from typing import Dict, List

from fastapi import APIRouter, HTTPException, Query

from app.data.store import application_store
from app.schemas.schemas import ApplicationRecord, LoanApplicationInput
from app.services.analysis_service import run_analysis

router = APIRouter(prefix="/api/applications", tags=["Applications"])

_FILTERS = ("all", "approved", "rejected", "manual_review", "high_risk")


def _matches_filter(record: Dict, filter_id: str) -> bool:
    decision = record["analysis"]["decision"]
    category = record["analysis"]["risk_category"]
    if filter_id == "approved":
        return decision == "APPROVED"
    if filter_id == "rejected":
        return decision == "REJECTED"
    if filter_id == "manual_review":
        return decision == "MANUAL_REVIEW"
    if filter_id == "high_risk":
        return category == "High"
    return True


@router.post("", response_model=ApplicationRecord, status_code=201)
def submit_application(payload: LoanApplicationInput) -> Dict:
    """Submit a new application: the engine analyses it and it is stored."""
    analysis = run_analysis(payload, application_store.all())
    return application_store.create(payload, analysis)


@router.get("", response_model=List[ApplicationRecord])
def list_applications(
    filter: str = Query(default="all", pattern="^(all|approved|rejected|manual_review|high_risk)$"),
) -> List[Dict]:
    """Retrieve all applications, newest first, optionally filtered."""
    if filter not in _FILTERS:
        filter = "all"
    apps = [r for r in application_store.all() if _matches_filter(r, filter)]
    return sorted(apps, key=lambda r: r["created_at"], reverse=True)


@router.get("/{application_id}", response_model=ApplicationRecord)
def get_application(application_id: str) -> Dict:
    record = application_store.get(application_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")
    return record
