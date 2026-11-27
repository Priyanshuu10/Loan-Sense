"""Decision recommendation engine.

Maps the risk score + financial checks + fraud flags to one of three outcomes:
APPROVED / MANUAL_REVIEW / REJECTED, always with a clear, data-driven
explanation, a recommended action and suggested next steps.
"""

from typing import Dict, List, Tuple

from app.schemas.schemas import EmploymentType, FraudFlag, LoanApplicationInput
from app.services.config import (
    DISPOSABLE_RECOMMENDED_MIN,
    DTI_CRITICAL_MAX,
    DTI_RECOMMENDED_MAX,
    DTI_WARNING_MAX,
    HIGH_RISK_MIN,
    LOW_RISK_MAX,
    DECISION_LABELS,
)


def decide(
    app: LoanApplicationInput,
    financials: Dict,
    flags: List[FraudFlag],
    score: float,
    category: str,
) -> Dict:
    critical_flags = [f for f in flags if f.severity == "critical"]
    warning_flags = [f for f in flags if f.severity == "warning"]

    dti = financials["dti_ratio"]
    disposable = financials["disposable_income"]
    disp_ratio = financials["disposable_income_ratio"]

    if score > HIGH_RISK_MIN or critical_flags or disposable < 0 or dti > DTI_CRITICAL_MAX:
        decision = "REJECTED"
    elif (
        score < LOW_RISK_MAX
        and dti <= DTI_RECOMMENDED_MAX
        and disp_ratio >= DISPOSABLE_RECOMMENDED_MIN
        and not warning_flags
    ):
        decision = "APPROVED"
    else:
        decision = "MANUAL_REVIEW"

    reasons = _build_reasons(app, financials, critical_flags, warning_flags, score, category)
    recommendation, next_steps = _recommendation(decision)
    summary = {
        "APPROVED": "Repayment capacity is strong and no blocking inconsistencies were found.",
        "MANUAL_REVIEW": "Affordability is borderline or unverified — route to a human underwriter.",
        "REJECTED": "The loan is unaffordable at the declared income level, or critical inconsistencies were detected.",
    }[decision]

    return {
        "decision": decision,
        "decision_label": DECISION_LABELS[decision],
        "decision_summary": summary,
        "reasons": reasons,
        "recommendation": recommendation,
        "next_steps": next_steps,
    }


def _build_reasons(
    app: LoanApplicationInput,
    financials: Dict,
    critical_flags: List[FraudFlag],
    warning_flags: List[FraudFlag],
    score: float,
    category: str,
) -> List[str]:
    """Generate 3-5 understandable reasons from the actual input data."""
    reasons: List[str] = []

    dti = financials["dti_ratio"]
    disp = financials["disposable_income"]
    disp_ratio = financials["disposable_income_ratio"]
    new_emi = financials["estimated_new_emi"]
    income = financials["monthly_income"]
    emi_ratio = (new_emi / income) if income > 0 else 2.0
    existing_ratio = (app.existing_emi / income) if income > 0 else 2.0
    lti = financials["loan_to_annual_income"]

    # 1. Disposable income (most severe condition first)
    if disp < 0:
        reasons.append(
            f"After expenses and all EMIs, the estimated monthly disposable income is negative "
            f"(−₹{abs(disp):,.0f}), so the borrower cannot cover the requested loan at the current income level."
        )

    # 2. Debt-to-income ratio
    if dti > DTI_WARNING_MAX:
        reasons.append(
            f"Debt-to-income ratio of {dti:.1f}% is far above the recommended ceiling of "
            f"{DTI_RECOMMENDED_MAX:.0f}% — existing and new EMIs together would consume most of the monthly income."
        )
    elif dti > DTI_RECOMMENDED_MAX:
        reasons.append(
            f"Debt-to-income ratio of {dti:.1f}% is above the recommended ceiling of {DTI_RECOMMENDED_MAX:.0f}%."
        )
    else:
        reasons.append(
            f"Debt-to-income ratio of {dti:.1f}% is within the healthy range (below {DTI_RECOMMENDED_MAX:.0f}%)."
        )

    # 3. Disposable income buffer (positive case)
    if disp >= 0 and disp_ratio < DISPOSABLE_RECOMMENDED_MIN:
        reasons.append(
            f"Monthly disposable income of ₹{disp:,.0f} is only {disp_ratio * 100:.1f}% of income, "
            "leaving a very thin buffer for emergencies."
        )
    elif disp >= 0:
        reasons.append(
            f"A disposable income of ₹{disp:,.0f} per month ({disp_ratio * 100:.0f}% of income) remains after "
            "expenses and EMIs, indicating comfortable repayment capacity."
        )

    # 4. New EMI burden
    if emi_ratio > 0.45:
        reasons.append(
            f"The estimated new EMI of ₹{new_emi:,.0f} alone consumes {emi_ratio * 100:.0f}% of monthly income."
        )
    elif emi_ratio > 0.25:
        reasons.append(
            f"The estimated EMI of ₹{new_emi:,.0f} takes {emi_ratio * 100:.0f}% of monthly income — a noticeable "
            "but generally manageable burden."
        )

    # 5. Loan size relative to income
    if lti > 2:
        reasons.append(
            f"The requested loan equals {lti:.1f}x the borrower's annual income, well beyond typical "
            "affordability norms for the declared income level."
        )
    elif lti > 1.2:
        reasons.append(
            f"The requested loan of ₹{app.loan_amount:,.0f} is {lti:.1f}x annual income — on the higher side "
            "relative to the declared income."
        )
    else:
        reasons.append(
            f"The requested loan of ₹{app.loan_amount:,.0f} is a modest {lti:.1f}x annual income relative to earnings."
        )

    # 6. Existing obligations
    if existing_ratio > 0.30:
        reasons.append(
            f"The borrower already commits ₹{app.existing_emi:,.0f} ({existing_ratio * 100:.0f}% of income) to "
            "existing EMIs, indicating significant prior financial obligations."
        )

    # 7. Employment stability
    if app.years_employment < 2:
        suffix = (
            " — self-employed income adds further uncertainty in this engine."
            if app.employment_type == EmploymentType.self_employed
            else "."
        )
        reasons.append(
            f"Employment history of {app.years_employment:g} year(s) is short, so stable income is harder "
            "to establish" + suffix
        )
    elif app.employment_type == EmploymentType.salaried and app.years_employment >= 5:
        reasons.append(
            f"Salaried employment of {app.years_employment:g} years supports a stable, predictable income stream."
        )

    # 8. Fraud / consistency flags
    if critical_flags:
        reasons.append(
            f"{len(critical_flags)} critical inconsistency flag(s) were detected and require manual "
            "verification before any approval (see the fraud detection panel)."
        )
    elif warning_flags:
        reasons.append(
            f"{len(warning_flags)} suspicious pattern(s) were flagged for verification — see the fraud "
            "detection panel."
        )
    else:
        reasons.append("No suspicious inconsistencies were detected in the declared financial data.")

    # Keep at most 5: first four (most severe) + the flags summary.
    if len(reasons) > 5:
        reasons = reasons[:4] + [reasons[-1]]
    if len(reasons) < 3:
        reasons.append(f"Composite risk score is {score:g}/100 ({category} risk).")
    return reasons


def _recommendation(decision: str) -> Tuple[str, List[str]]:
    if decision == "APPROVED":
        return (
            "Approve the loan for sanction, subject to standard documentation checks (simulated workflow).",
            [
                "Verify KYC documents and income proof (simulated).",
                "Generate the sanction letter with the agreed amount, rate and tenure.",
                "Schedule disbursement and share the EMI calendar with the borrower.",
                "Set up repayment reminders and monitor the first two EMIs closely.",
            ],
        )
    if decision == "MANUAL_REVIEW":
        return (
            "Route the application to a human underwriter for verification before a final decision.",
            [
                "Request updated bank statements and latest salary slips / business financials.",
                "Verify employer or business details through independent channels.",
                "Re-check declared expenses and existing obligations against bureau data (simulated).",
                "Re-run the AI analysis once the verified documents are available.",
            ],
        )
    return (
        "Decline the application in its current form and share remediation options with the borrower.",
        [
            "Send an adverse-action notice listing the principal reasons (simulated).",
            "Suggest a lower loan amount or a longer tenure to improve affordability.",
            "Recommend reducing existing EMI commitments before re-applying.",
            "Invite the borrower to re-apply once the financial position improves.",
        ],
    )
