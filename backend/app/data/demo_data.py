"""Demo scenarios and seed applications for the LoanSense AI prototype.

The three faculty demo scenarios (A/B/C) are exposed via GET /api/demo/scenarios
and are ALSO seeded into the store so the admin dashboard has realistic data
from the first load. Every seed application is analysed by the real scoring
engine at startup — nothing is hardcoded per borrower.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List

from app.data.store import ApplicationStore

DEMO_SCENARIOS: List[Dict] = [
    {
        "id": "A",
        "title": "Scenario A · Low-Risk Borrower",
        "subtitle": "Rahul Sharma — Salaried, ₹90,000/month",
        "expected_outcome": "APPROVED · LOW RISK",
        "narrative": (
            "Strong affordability: stable salaried income, minimal existing EMI and a moderate "
            "₹5,00,000 request over 60 months."
        ),
        "application": {
            "full_name": "Rahul Sharma",
            "age": 28,
            "employment_type": "salaried",
            "employer_name": "TCS",
            "years_employment": 5,
            "monthly_income": 90000,
            "monthly_expenses": 20000,
            "existing_emi": 5000,
            "outstanding_debt": 100000,
            "loan_amount": 500000,
            "tenure_months": 60,
            "loan_purpose": "personal",
        },
    },
    {
        "id": "B",
        "title": "Scenario B · Medium-Risk Borrower",
        "subtitle": "Priya Das — Salaried, ₹55,000/month",
        "expected_outcome": "MANUAL REVIEW · MEDIUM RISK",
        "narrative": (
            "Borderline profile: an ₹8,00,000 request over 48 months pushes the debt-to-income ratio "
            "near 59% and leaves almost no monthly buffer."
        ),
        "application": {
            "full_name": "Priya Das",
            "age": 32,
            "employment_type": "salaried",
            "employer_name": "Wipro",
            "years_employment": 3,
            "monthly_income": 55000,
            "monthly_expenses": 22000,
            "existing_emi": 12000,
            "outstanding_debt": 300000,
            "loan_amount": 800000,
            "tenure_months": 48,
            "loan_purpose": "education",
        },
    },
    {
        "id": "C",
        "title": "Scenario C · High-Risk Borrower",
        "subtitle": "Amit Kumar — Self-employed, ₹30,000/month",
        "expected_outcome": "REJECTED · HIGH RISK",
        "narrative": (
            "Unaffordable request: a ₹30,00,000 business loan produces EMIs far beyond the declared "
            "income, on top of heavy existing obligations."
        ),
        "application": {
            "full_name": "Amit Kumar",
            "age": 25,
            "employment_type": "self_employed",
            "employer_name": "Kumar Telecom",
            "years_employment": 1,
            "monthly_income": 30000,
            "monthly_expenses": 18000,
            "existing_emi": 20000,
            "outstanding_debt": 600000,
            "loan_amount": 3000000,
            "tenure_months": 60,
            "loan_purpose": "business",
        },
    },
]

# Additional realistic sample applications so the dashboard has at least 5 rows.
SEED_APPLICATIONS: List[Dict] = [
    {**DEMO_SCENARIOS[0]["application"], "days_ago": 1},
    {**DEMO_SCENARIOS[1]["application"], "days_ago": 2},
    {**DEMO_SCENARIOS[2]["application"], "days_ago": 3},
    {
        "full_name": "Sneha Iyer",
        "age": 34,
        "employment_type": "salaried",
        "employer_name": "Infosys",
        "years_employment": 7,
        "monthly_income": 120000,
        "monthly_expenses": 35000,
        "existing_emi": 18000,
        "outstanding_debt": 250000,
        "loan_amount": 1500000,
        "tenure_months": 240,
        "loan_purpose": "home",
        "days_ago": 4,
    },
    {
        "full_name": "Vikram Singh",
        "age": 41,
        "employment_type": "self_employed",
        "employer_name": "Singh Traders",
        "years_employment": 8,
        "monthly_income": 85000,
        "monthly_expenses": 40000,
        "existing_emi": 15000,
        "outstanding_debt": 400000,
        "loan_amount": 1200000,
        "tenure_months": 60,
        "loan_purpose": "business",
        "days_ago": 6,
    },
    {
        "full_name": "Kavita Joshi",
        "age": 23,
        "employment_type": "salaried",
        "employer_name": "Flipkart",
        "years_employment": 1.5,
        "monthly_income": 42000,
        "monthly_expenses": 15000,
        "existing_emi": 3000,
        "outstanding_debt": 80000,
        "loan_amount": 900000,
        "tenure_months": 48,
        "loan_purpose": "vehicle",
        "days_ago": 7,
    },
    {
        "full_name": "Rakesh Yadav",
        "age": 38,
        "employment_type": "self_employed",
        "employer_name": "Yadav Hardware",
        "years_employment": 2,
        "monthly_income": 40000,
        "monthly_expenses": 25000,
        "existing_emi": 14000,
        "outstanding_debt": 500000,
        "loan_amount": 1500000,
        "tenure_months": 36,
        "loan_purpose": "business",
        "days_ago": 8,
    },
]


def seed_store_with_demo_data(store: ApplicationStore) -> None:
    """Analyse + store every seed application through the real engine."""
    from app.schemas.schemas import LoanApplicationInput
    from app.services.analysis_service import run_analysis

    for seed in SEED_APPLICATIONS:
        days_ago = seed["days_ago"]
        payload = {k: v for k, v in seed.items() if k != "days_ago"}
        app_input = LoanApplicationInput(**payload)
        analysis = run_analysis(app_input, store.all())
        created_at = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        store.create(app_input, analysis, created_at=created_at)
