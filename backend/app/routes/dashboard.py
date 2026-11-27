"""Dashboard statistics for the admin overview."""

from typing import Dict, List

from fastapi import APIRouter

from app.data.store import application_store
from app.schemas.schemas import DashboardStats, DashboardTotals, DistributionPoint
from app.services.config import DECISION_LABELS, PURPOSE_LABELS

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats() -> Dict:
    apps = sorted(application_store.all(), key=lambda r: r["created_at"], reverse=True)
    analyses = [a["analysis"] for a in apps]

    total = len(apps)
    approved = sum(1 for a in analyses if a["decision"] == "APPROVED")
    rejected = sum(1 for a in analyses if a["decision"] == "REJECTED")
    manual_review = sum(1 for a in analyses if a["decision"] == "MANUAL_REVIEW")
    high_risk = sum(1 for a in analyses if a["risk_category"] == "High")

    avg_score = round(sum(a["risk_score"] for a in analyses) / total, 1) if total else 0.0
    amounts = [a["input"]["loan_amount"] for a in apps]
    total_requested = float(sum(amounts))
    avg_loan = round(total_requested / total, 0) if total else 0.0

    totals = DashboardTotals(
        total_applications=total,
        approved=approved,
        rejected=rejected,
        manual_review=manual_review,
        high_risk=high_risk,
        avg_risk_score=avg_score,
        total_requested_amount=total_requested,
        avg_loan_amount=avg_loan,
    )

    # Loan application distribution by purpose
    def _purpose_key(raw: object) -> str:
        return str(raw.value) if hasattr(raw, "value") else str(raw)

    purpose_counts: Dict[str, int] = {}
    for a in apps:
        key = _purpose_key(a["input"]["loan_purpose"])
        purpose_counts[key] = purpose_counts.get(key, 0) + 1
    purpose_distribution = [
        DistributionPoint(name=PURPOSE_LABELS.get(k, k.title()), value=v)
        for k, v in sorted(purpose_counts.items(), key=lambda kv: -kv[1])
    ]

    # Risk category distribution (always show all three bands)
    risk_distribution = [
        DistributionPoint(name=cat, value=sum(1 for a in analyses if a["risk_category"] == cat))
        for cat in ("Low", "Medium", "High")
    ]

    # Approval vs rejection statistics
    decision_distribution = [
        DistributionPoint(name=DECISION_LABELS[d], value=sum(1 for a in analyses if a["decision"] == d))
        for d in ("APPROVED", "MANUAL_REVIEW", "REJECTED")
    ]

    return DashboardStats(
        totals=totals,
        purpose_distribution=purpose_distribution,
        risk_distribution=risk_distribution,
        decision_distribution=decision_distribution,
    )
