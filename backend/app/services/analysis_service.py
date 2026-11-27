"""Analysis pipeline orchestrator.

Runs the full LoanSense AI flow for one application:
  financials -> fraud checks -> risk score -> classification -> decision
and assembles the complete RiskAnalysis payload returned by the API.
"""

from typing import Dict, List

from app.schemas.schemas import LoanApplicationInput
from app.services import decision_engine, fraud_detection, risk_engine
from app.services.config import ENGINE_NOTE


def run_analysis(app_input: LoanApplicationInput, prior_records: List[Dict]) -> Dict:
    financials = risk_engine.compute_financials(app_input)
    flags = fraud_detection.run_checks(app_input, financials, prior_records)
    score, components = risk_engine.compute_risk_score(app_input, financials, flags)
    category = risk_engine.classify_risk(score)
    probability = risk_engine.estimate_default_probability(score)
    affordability = risk_engine.affordability_status(financials)
    decision = decision_engine.decide(app_input, financials, flags, score, category)

    critical_count = sum(1 for f in flags if f.severity == "critical")
    if not flags:
        validation_status = "Passed — no suspicious inconsistencies detected in the declared data."
    elif critical_count:
        validation_status = (
            f"{critical_count} critical inconsistency(ies) detected — manual verification is mandatory "
            "before any approval."
        )
    else:
        validation_status = f"{len(flags)} suspicious pattern(s) flagged — verification recommended before approval."

    return {
        "risk_score": score,
        "default_probability": probability,
        "risk_category": category,
        "affordability_status": affordability,
        **decision,
        "fraud_flags": [f.model_dump() for f in flags],
        "fraud_flag_count": len(flags),
        "critical_flag_count": critical_count,
        "validation_status": validation_status,
        "financials": financials,
        "score_components": components,
        "engine_note": ENGINE_NOTE,
    }
