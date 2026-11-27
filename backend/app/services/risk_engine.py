"""Transparent, rule-based risk scoring engine for LoanSense AI.

DEMONSTRATION ONLY: every factor below is a simple, explainable heuristic
chosen for an academic prototype. This is NOT a trained or validated
credit-risk model and must not be used for real lending decisions.

The composite risk score is a 0-100 number where HIGHER means RISKIER:
  score < 35  -> Low risk
  35-65       -> Medium risk
  score > 65  -> High risk
"""

from typing import Dict, List, Tuple

from app.schemas.schemas import EmploymentType, FraudFlag, LoanApplicationInput
from app.services.config import (
    ANNUAL_INTEREST_RATE,
    DTI_RECOMMENDED_MAX,
    FLAG_PENALTY,
    FRAUD_PENALTY_CAP,
    HIGH_RISK_MIN,
    LOW_RISK_MAX,
    PD_BASE,
    PD_EXPONENT,
    PD_SCALE,
    SCORE_WEIGHTS,
)


def estimate_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
    """Standard reducing-balance EMI formula:

    EMI = P * r * (1 + r)^n / ((1 + r)^n - 1),  r = annual rate / 12 / 100.
    """
    if tenure_months <= 0:
        return principal
    r = annual_rate_pct / 12 / 100
    if r == 0:
        return principal / tenure_months
    growth = (1 + r) ** tenure_months
    return principal * r * growth / (growth - 1)


def _interp(value: float, points: List[Tuple[float, float]]) -> float:
    """Piecewise-linear interpolation with clamping at both ends.

    `points` are (input, score) pairs sorted ascending. This keeps every
    factor curve explicit and auditable for the demo.
    """
    pts = sorted(points)
    if value <= pts[0][0]:
        return pts[0][1]
    if value >= pts[-1][0]:
        return pts[-1][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= value <= x1:
            if x1 == x0:
                return y1
            return y0 + (value - x0) / (x1 - x0) * (y1 - y0)
    return pts[-1][1]


def compute_financials(app: LoanApplicationInput) -> Dict:
    """Derive the core affordability metrics from the declared inputs."""
    income = app.monthly_income
    new_emi = round(estimate_emi(app.loan_amount, ANNUAL_INTEREST_RATE, app.tenure_months), 2)
    total_emi = round(app.existing_emi + new_emi, 2)

    if income > 0:
        dti = total_emi / income * 100
        disposable = income - app.monthly_expenses - total_emi
        disposable_ratio = disposable / income
        loan_to_annual = app.loan_amount / (income * 12)
    else:
        dti = 100.0 if total_emi > 0 else 0.0
        disposable = -app.monthly_expenses - total_emi
        disposable_ratio = -1.0
        loan_to_annual = 10.0

    return {
        "monthly_income": income,
        "monthly_expenses": app.monthly_expenses,
        "existing_emi": app.existing_emi,
        "estimated_new_emi": new_emi,
        "total_emi_obligations": total_emi,
        "dti_ratio": round(dti, 2),
        "disposable_income": round(disposable, 2),
        "disposable_income_ratio": round(disposable_ratio, 4),
        "loan_to_annual_income": round(loan_to_annual, 2),
        "interest_rate_annual": ANNUAL_INTEREST_RATE,
        "loan_amount": app.loan_amount,
        "tenure_months": app.tenure_months,
    }


def _stability_score(app: LoanApplicationInput) -> float:
    """Income stability factor: employment type, history length, age."""
    if app.employment_type == EmploymentType.salaried:
        score = 15 - min(app.years_employment * 3, 15)
    else:
        score = 30 - min(app.years_employment * 2.5, 10)
    if app.age < 21:
        score += 20
    if app.age > 60:
        score += 10
    return max(2.0, min(100.0, score))


def compute_risk_score(
    app: LoanApplicationInput,
    financials: Dict,
    flags: List[FraudFlag],
) -> Tuple[float, List[Dict]]:
    """Weighted composite of transparent factor scores (0 = safest, 100 = riskiest)."""
    income = app.monthly_income

    dti = financials["dti_ratio"]
    disp_ratio = financials["disposable_income_ratio"]
    emi_ratio = (financials["estimated_new_emi"] / income) if income > 0 else 1.5
    existing_ratio = (app.existing_emi / income) if income > 0 else 1.5
    lti = financials["loan_to_annual_income"]

    dti_score = _interp(dti, [(0, 0), (15, 5), (30, 25), (40, 45), (50, 65), (60, 80), (80, 95), (120, 100)])
    disp_score = _interp(
        disp_ratio,
        [(-0.5, 100), (-0.001, 100), (0.0, 78), (0.05, 60), (0.10, 45), (0.15, 32), (0.25, 18), (0.40, 8), (1.0, 3)],
    )
    emi_score = _interp(emi_ratio, [(0, 0), (0.10, 5), (0.20, 15), (0.30, 35), (0.40, 55), (0.50, 75), (0.75, 92), (1.0, 100)])
    lti_score = _interp(lti, [(0, 0), (0.25, 5), (0.5, 12), (1.0, 30), (1.5, 45), (2.0, 60), (3.0, 80), (5.0, 100)])
    debt_score = _interp(existing_ratio, [(0, 0), (0.10, 8), (0.20, 20), (0.30, 35), (0.50, 60), (0.75, 85), (1.0, 100)])
    stab_score = _stability_score(app)

    penalty = min(FRAUD_PENALTY_CAP, sum(FLAG_PENALTY.get(f.severity, 5) for f in flags))

    emp_label = "Salaried" if app.employment_type == EmploymentType.salaried else "Self-employed"
    components = [
        {
            "key": "dti",
            "label": "Debt-to-Income Ratio",
            "factor_score": round(dti_score, 1),
            "weight": SCORE_WEIGHTS["dti"],
            "contribution": round(dti_score * SCORE_WEIGHTS["dti"], 2),
            "detail": f"Existing + new EMIs are {dti:.1f}% of monthly income",
        },
        {
            "key": "disposable",
            "label": "Disposable Income Buffer",
            "factor_score": round(disp_score, 1),
            "weight": SCORE_WEIGHTS["disposable"],
            "contribution": round(disp_score * SCORE_WEIGHTS["disposable"], 2),
            "detail": f"Disposable income is {disp_ratio * 100:.1f}% of income after expenses and all EMIs",
        },
        {
            "key": "emi_burden",
            "label": "New EMI Burden",
            "factor_score": round(emi_score, 1),
            "weight": SCORE_WEIGHTS["emi_burden"],
            "contribution": round(emi_score * SCORE_WEIGHTS["emi_burden"], 2),
            "detail": f"Estimated new EMI alone is {emi_ratio * 100:.1f}% of monthly income",
        },
        {
            "key": "loan_to_income",
            "label": "Loan Size vs Income",
            "factor_score": round(lti_score, 1),
            "weight": SCORE_WEIGHTS["loan_to_income"],
            "contribution": round(lti_score * SCORE_WEIGHTS["loan_to_income"], 2),
            "detail": f"Requested loan is {lti:.1f}x annual income",
        },
        {
            "key": "stability",
            "label": "Income Stability",
            "factor_score": round(stab_score, 1),
            "weight": SCORE_WEIGHTS["stability"],
            "contribution": round(stab_score * SCORE_WEIGHTS["stability"], 2),
            "detail": f"{emp_label} with {app.years_employment:g} yr(s) experience, age {app.age}",
        },
        {
            "key": "existing_debt",
            "label": "Existing Obligations",
            "factor_score": round(debt_score, 1),
            "weight": SCORE_WEIGHTS["existing_debt"],
            "contribution": round(debt_score * SCORE_WEIGHTS["existing_debt"], 2),
            "detail": f"Existing EMI is {existing_ratio * 100:.1f}% of monthly income",
        },
        {
            "key": "fraud_penalty",
            "label": "Fraud / Consistency Flags",
            "factor_score": round(penalty, 1),
            "weight": SCORE_WEIGHTS["fraud_penalty"],
            "contribution": round(penalty * SCORE_WEIGHTS["fraud_penalty"], 2),
            "detail": f"{len(flags)} inconsistency flag(s) raise the risk component",
        },
    ]

    score = round(max(0.0, min(100.0, sum(c["contribution"] for c in components))), 1)
    return score, components


def classify_risk(score: float) -> str:
    """Illustrative classification bands from the project spec."""
    if score < LOW_RISK_MAX:
        return "Low"
    if score <= HIGH_RISK_MIN:
        return "Medium"
    return "High"


def estimate_default_probability(score: float) -> float:
    """Illustrative mapping of the composite score to a default probability."""
    pd_value = PD_BASE + PD_SCALE * (score / 100.0) ** PD_EXPONENT
    return round(min(0.97, max(0.01, pd_value)), 3)


def affordability_status(financials: Dict) -> str:
    """Plain-language affordability verdict based on DTI and disposable income."""
    dti = financials["dti_ratio"]
    disp = financials["disposable_income"]
    ratio = financials["disposable_income_ratio"]

    if dti <= DTI_RECOMMENDED_MAX and ratio >= 0.25:
        return "Comfortable"
    if dti <= DTI_RECOMMENDED_MAX + 10 and ratio >= 0.10:
        return "Manageable"
    if disp > 0 and dti <= 65.0:
        return "Tight"
    return "Unaffordable"
