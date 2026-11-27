"""Demonstration-grade fraud & financial-consistency checks.

Each detected issue is surfaced as a separate flag and labelled as a
SUSPICIOUS INCONSISTENCY REQUIRING VERIFICATION — an anomaly alone never
proves fraud.
"""

from typing import Dict, List

from app.schemas.schemas import FraudFlag, LoanApplicationInput


def run_checks(
    app: LoanApplicationInput,
    financials: Dict,
    prior_records: List[Dict],
) -> List[FraudFlag]:
    """Run every consistency check and return the collected flags."""
    flags: List[FraudFlag] = []

    def add(code: str, severity: str, title: str, description: str) -> None:
        flags.append(
            FraudFlag(id=f"F{len(flags) + 1:02d}", code=code, severity=severity, title=title, description=description)
        )

    income = app.monthly_income

    # 1. Unrealistic age values ------------------------------------------------
    if app.age < 18:
        add(
            "AGE",
            "critical",
            "Unrealistic age value",
            f"Declared age {app.age} is below the legal lending age of 18 — possible data-entry "
            "error or identity issue. Verification required.",
        )
    elif app.age > 75:
        add(
            "AGE",
            "warning",
            "Unusual age value",
            f"Declared age {app.age} is unusually high for a fresh loan application — verify identity "
            "and the remaining repayment horizon.",
        )

    # 2. Invalid or zero income -------------------------------------------------
    if income <= 0:
        add(
            "INC",
            "critical",
            "Invalid or missing income",
            "Declared monthly income is zero — affordability cannot be established without a valid "
            "income source. Verification required.",
        )

    # 3. Loan request extremely high relative to income --------------------------
    if income > 0 and app.loan_amount > 30 * income:
        multiple = app.loan_amount / income
        add(
            "LTV",
            "critical",
            "Loan request far exceeds income",
            f"Requested loan ₹{app.loan_amount:,.0f} is {multiple:.0f}x the declared monthly income "
            "— far beyond typical affordability norms. Verification required.",
        )

    # 4. Existing EMI exceeding income -------------------------------------------
    if income > 0 and app.existing_emi > income:
        add(
            "EMI-EX",
            "critical",
            "Existing EMI exceeds income",
            f"Existing EMI ₹{app.existing_emi:,.0f} already exceeds the declared monthly income of "
            f"₹{income:,.0f} — before the new loan is even considered.",
        )

    # 5. Combined EMI obligations exceeding income --------------------------------
    if income > 0 and financials["total_emi_obligations"] > income and app.existing_emi <= income:
        add(
            "EMI-TOT",
            "critical",
            "Total EMI obligations exceed income",
            f"Existing EMI ₹{app.existing_emi:,.0f} + estimated new EMI "
            f"₹{financials['estimated_new_emi']:,.0f} = ₹{financials['total_emi_obligations']:,.0f}, "
            f"which exceeds the declared monthly income of ₹{income:,.0f}.",
        )

    # 6. Zero / implausible employment experience ---------------------------------
    if app.years_employment <= 0:
        add(
            "EMP",
            "warning",
            "No employment history declared",
            "Zero years of employment declared — income stability cannot be established. "
            "Verification required.",
        )
    if app.age - app.years_employment < 16:
        add(
            "EMP-AGE",
            "warning",
            "Employment history inconsistent with age",
            f"Declared {app.years_employment:g} year(s) of employment is inconsistent with age "
            f"{app.age} (employment would have begun before age 16).",
        )

    # 7. Suspiciously high income with very low declared expenses ------------------
    if income >= 50000 and app.monthly_expenses < income * 0.05:
        add(
            "EXP",
            "warning",
            "Declared expenses unusually low",
            f"Monthly expenses ₹{app.monthly_expenses:,.0f} are below 5% of the declared income of "
            f"₹{income:,.0f} — possible undeclared obligations. Verification suggested.",
        )

    # 8. Very high outstanding debt -------------------------------------------------
    if income > 0 and app.outstanding_debt > 24 * income:
        add(
            "DEBT",
            "warning",
            "Outstanding debt very high",
            f"Total outstanding debt ₹{app.outstanding_debt:,.0f} exceeds two years of declared income "
            "— verify liabilities against a credit bureau report (simulated).",
        )

    # 9. Duplicate borrower applications ---------------------------------------------
    normalized = app.full_name.strip().lower()
    for prior in prior_records:
        prior_input = prior.get("input", {})
        prior_name = str(prior_input.get("full_name", "")).strip().lower()
        if prior_name == normalized:
            same_amount = prior_input.get("loan_amount") == app.loan_amount
            if same_amount:
                add(
                    "DUP",
                    "info",
                    "Repeat submission detected",
                    f"An application from '{prior_input.get('full_name')}' for the same amount already "
                    f"exists ({prior.get('application_id')}). This appears to be a resubmission of the "
                    "same request.",
                )
            else:
                add(
                    "DUP",
                    "info",
                    "Possible duplicate borrower",
                    f"An application from '{prior_input.get('full_name')}' already exists in the system "
                    f"({prior.get('application_id')}) with a different loan amount. Confirm this is not "
                    "a repeat submission.",
                )
            break

    # 10. Salaried borrower without an employer name ----------------------------------
    if app.employment_type == "salaried" and not app.employer_name.strip():
        add(
            "EMPLOYER",
            "info",
            "Employer name missing",
            "Salaried borrower did not declare an employer name — employment verification is "
            "recommended before approval.",
        )

    return flags
