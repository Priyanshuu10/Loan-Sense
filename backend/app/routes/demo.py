"""Demo scenario routes."""

from typing import Dict, List

from fastapi import APIRouter

from app.data.demo_data import DEMO_SCENARIOS
from app.schemas.schemas import DemoScenario

router = APIRouter(prefix="/api/demo", tags=["Demo"])


@router.get("/scenarios", response_model=List[DemoScenario])
def demo_scenarios() -> List[Dict]:
    """The three preloaded demo scenarios shown on the application form."""
    return DEMO_SCENARIOS
