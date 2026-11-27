"""LoanSense AI — FastAPI application entrypoint.

Demonstration backend for an AI-assisted loan underwriting prototype.
All scores and decisions come from a transparent heuristic engine running on
simulated data — NOT a validated credit-risk model.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data.demo_data import seed_store_with_demo_data
from app.data.store import application_store
from app.routes import analysis, applications, dashboard, demo


@asynccontextmanager
async def lifespan(_: FastAPI):
    if application_store.count() == 0:
        seed_store_with_demo_data(application_store)
    yield


app = FastAPI(
    title="LoanSense AI — Demo API",
    description=(
        "Demonstration backend for an AI-powered loan approval & risk management "
        "prototype. The risk score, default probability and decision are produced "
        "by a transparent heuristic engine on declared inputs — not a trained or "
        "validated credit-risk model."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications.router)
app.include_router(analysis.router)
app.include_router(dashboard.router)
app.include_router(demo.router)


@app.get("/api/health", tags=["System"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "loansense-ai",
        "engine": "heuristic-demo-v0.1",
        "applications_stored": application_store.count(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
