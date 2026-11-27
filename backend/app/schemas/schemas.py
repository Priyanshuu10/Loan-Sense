"""Pydantic schemas shared across the LoanSense AI API."""

from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class EmploymentType(str, Enum):
    salaried = "salaried"
    self_employed = "self_employed"


class LoanPurpose(str, Enum):
    personal = "personal"
    home = "home"
    vehicle = "vehicle"
    education = "education"
    business = "business"
    other = "other"


class LoanApplicationInput(BaseModel):
    """Borrower + loan request data collected from the application form."""

    full_name: str = Field(..., min_length=2, max_length=80)
    age: int = Field(..., ge=1, le=120, description="Borrower age in years")
    employment_type: EmploymentType
    employer_name: str = Field(default="", max_length=80)
    years_employment: float = Field(..., ge=0, le=50)
    monthly_income: float = Field(..., ge=0, le=10_000_000)
    monthly_expenses: float = Field(..., ge=0, le=10_000_000)
    existing_emi: float = Field(..., ge=0, le=10_000_000)
    outstanding_debt: float = Field(..., ge=0, le=100_000_000)
    loan_amount: float = Field(..., gt=0, le=10_000_000)
    tenure_months: int = Field(..., ge=6, le=360)
    loan_purpose: LoanPurpose

    @field_validator("full_name")
    @classmethod
    def _name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be blank")
        return v.strip()

    @field_validator("employer_name")
    @classmethod
    def _employer_optional(cls, v: str) -> str:
        return v.strip()


class FraudFlag(BaseModel):
    """A single suspicious inconsistency detected by the fraud module.

    Flags are ALWAYS labelled as items requiring verification — an anomaly
    alone never proves fraud.
    """

    id: str
    code: str
    severity: Literal["info", "warning", "critical"]
    title: str
    description: str


class ScoreComponent(BaseModel):
    """One weighted factor of the transparent risk score."""

    key: str
    label: str
    factor_score: float = Field(..., description="Raw factor risk, 0 (safe) to 100 (risky)")
    weight: float = Field(..., description="Weight of this factor in the composite score")
    contribution: float = Field(..., description="Weighted points added to the composite risk score")
    detail: str = Field(..., description="Human-readable explanation of this factor")


class FinancialAnalysis(BaseModel):
    monthly_income: float
    monthly_expenses: float
    existing_emi: float
    estimated_new_emi: float
    total_emi_obligations: float
    dti_ratio: float = Field(..., description="Debt-to-income ratio in percent")
    disposable_income: float
    disposable_income_ratio: float = Field(..., description="Disposable income as a fraction of income")
    loan_to_annual_income: float
    interest_rate_annual: float
    loan_amount: float
    tenure_months: int


class RiskAnalysis(BaseModel):
    """Full output of the LoanSense AI analysis pipeline."""

    risk_score: float = Field(..., ge=0, le=100)
    default_probability: float = Field(..., ge=0, le=1)
    risk_category: Literal["Low", "Medium", "High"]
    affordability_status: str
    decision: Literal["APPROVED", "MANUAL_REVIEW", "REJECTED"]
    decision_label: str
    decision_summary: str
    reasons: List[str] = Field(..., description="Explainable-AI reasons derived from the input data")
    recommendation: str
    next_steps: List[str]
    fraud_flags: List[FraudFlag]
    fraud_flag_count: int
    critical_flag_count: int
    validation_status: str
    financials: FinancialAnalysis
    score_components: List[ScoreComponent]
    engine_note: str


class ApplicationRecord(BaseModel):
    application_id: str
    created_at: str
    input: LoanApplicationInput
    analysis: RiskAnalysis


class AnalyzeResponse(BaseModel):
    """Response for the dry-run /api/analyze endpoint (nothing is stored)."""

    analysis: RiskAnalysis
    stored: bool = False
    note: str


class DashboardTotals(BaseModel):
    total_applications: int
    approved: int
    rejected: int
    manual_review: int
    high_risk: int
    avg_risk_score: float
    total_requested_amount: float
    avg_loan_amount: float


class DistributionPoint(BaseModel):
    name: str
    value: float


class DashboardStats(BaseModel):
    totals: DashboardTotals
    purpose_distribution: List[DistributionPoint]
    risk_distribution: List[DistributionPoint]
    decision_distribution: List[DistributionPoint]


class DemoScenario(BaseModel):
    id: str
    title: str
    subtitle: str
    expected_outcome: str
    narrative: str
    application: LoanApplicationInput


class HealthStatus(BaseModel):
    status: str
    service: str
    engine: str
    applications_stored: int
    timestamp: str
