"""Dry-run risk analysis endpoint (nothing is stored)."""

from fastapi import APIRouter

from app.data.store import application_store
from app.schemas.schemas import AnalyzeResponse, LoanApplicationInput
from app.services.analysis_service import run_analysis

router = APIRouter(tags=["Analysis"])


@router.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_application(payload: LoanApplicationInput) -> AnalyzeResponse:
    """Run the AI risk pipeline WITHOUT saving the application.

    Useful for what-if experiments in the demo. Use POST /api/applications
    to submit + store an application.
    """
    analysis = run_analysis(payload, application_store.all())
    return AnalyzeResponse(
        analysis=analysis,
        stored=False,
        note=(
            "Dry-run analysis — this application was NOT saved. "
            "Submit via POST /api/applications to store it."
        ),
    )
