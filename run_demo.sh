#!/usr/bin/env bash
# LoanSense AI — one-command demo launcher.
# Starts the FastAPI backend (port 8000) and the Vite frontend (port 5173).
# Press Ctrl+C to stop both.

set -e
cd "$(dirname "$0")"

cleanup() {
  echo ""
  echo "Stopping LoanSense AI…"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "▶ Starting LoanSense AI backend on http://localhost:8000 …"
(
  cd backend
  if [ ! -d .venv ]; then
    python3 -m venv .venv && ./.venv/bin/pip install -q -r requirements.txt
  fi
  ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 2>/dev/null \
    || python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

echo "▶ Starting LoanSense AI frontend on http://localhost:5173 …"
(
  cd frontend
  [ -d node_modules ] || npm install --no-audit --no-fund
  npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "✅ LoanSense AI is starting…"
echo "   App:  http://localhost:5173"
echo "   API:  http://localhost:8000/docs"
wait
