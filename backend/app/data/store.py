"""Lightweight in-memory application store.

The prototype deliberately avoids PostgreSQL/Redis — everything lives in a
single dict guarded by a lock. Restarting the API re-seeds the demo data.
"""

import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.schemas.schemas import LoanApplicationInput


class ApplicationStore:
    def __init__(self, id_prefix: str = "LSA-2026-") -> None:
        self._records: Dict[str, dict] = {}
        self._lock = threading.Lock()
        self._counter = 0
        self._prefix = id_prefix

    def create(
        self,
        app_input: LoanApplicationInput,
        analysis: Dict,
        created_at: Optional[str] = None,
    ) -> Dict:
        with self._lock:
            self._counter += 1
            application_id = f"{self._prefix}{self._counter:04d}"
            record = {
                "application_id": application_id,
                "created_at": created_at or datetime.now(timezone.utc).isoformat(),
                "input": app_input.model_dump(),
                "analysis": analysis,
            }
            self._records[application_id] = record
            return record

    def all(self) -> List[Dict]:
        return list(self._records.values())

    def get(self, application_id: str) -> Optional[Dict]:
        return self._records.get(application_id)

    def count(self) -> int:
        return len(self._records)


application_store = ApplicationStore()
