"""Central configuration for the LoanSense AI demonstration scoring engine.

Every threshold, weight and rate below is an ILLUSTRATIVE value chosen for an
academic demonstration. They are deliberately kept in one place so the scoring
logic stays transparent and easy to tune during a demo. Nothing here is
calibrated against real credit data.
"""

# ---------------------------------------------------------------- interest --
# Illustrative annual reducing-balance interest rate (%) used to estimate the
# monthly EMI of the requested loan.
ANNUAL_INTEREST_RATE = 10.5

# ------------------------------------------------------- decision thresholds --
DTI_RECOMMENDED_MAX = 40.0        # % of income committed to all EMIs (healthy ceiling)
DTI_WARNING_MAX = 50.0            # above this, the DTI reason becomes "far above"
DTI_CRITICAL_MAX = 75.0           # above this, the loan is treated as unaffordable
DISPOSABLE_RECOMMENDED_MIN = 0.15  # disposable income / monthly income (fraction)
EMPLOYMENT_STABILITY_MIN_YEARS = 2  # below this, income stability is questioned

# ------------------------------------------------------------ score weights --
# Weights of each factor in the composite 0-100 risk score (higher = riskier).
# The sum of weights must equal 1.0.
SCORE_WEIGHTS = {
    "dti": 0.25,             # debt-to-income ratio
    "disposable": 0.20,      # disposable income buffer after expenses + EMIs
    "emi_burden": 0.15,      # new EMI alone as a share of income
    "loan_to_income": 0.15,  # loan amount vs annual income
    "stability": 0.10,       # employment type / history / age
    "existing_debt": 0.10,   # existing EMI as a share of income
    "fraud_penalty": 0.05,   # penalty component driven by fraud flags
}

# Severity -> penalty points fed into the fraud component (capped).
FLAG_PENALTY = {"info": 5, "warning": 15, "critical": 40}
FRAUD_PENALTY_CAP = 100.0

# ------------------------------------------------------ classification bands --
LOW_RISK_MAX = 35.0   # score below this  -> Low risk
HIGH_RISK_MIN = 65.0  # score above this  -> High risk (35-65 -> Medium)

# ------------------------------------------------- default probability map --
# Illustrative mapping of the risk score to a "default probability".
PD_BASE = 0.02
PD_SCALE = 0.85
PD_EXPONENT = 2.0

# ------------------------------------------------------------- engine note --
ENGINE_NOTE = (
    "Demonstration output of a transparent heuristic engine running on "
    "borrower-declared inputs. This is NOT a trained or validated credit-risk "
    "model and must not be used for real lending decisions."
)

# --------------------------------------------------------------- api labels --
PURPOSE_LABELS = {
    "personal": "Personal",
    "home": "Home Loan",
    "vehicle": "Vehicle",
    "education": "Education",
    "business": "Business",
    "other": "Other",
}

DECISION_LABELS = {
    "APPROVED": "Approved",
    "MANUAL_REVIEW": "Manual Review",
    "REJECTED": "Rejected",
}
