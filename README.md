# LoanSense AI — AI-Powered Loan Approval & Risk Management System

> **Smarter Lending. Safer Decisions.**

A polished, functional **academic demonstration prototype** of an AI-powered loan underwriting platform. It showcases the complete proposed workflow — application intake, transparent AI risk scoring, fraud/consistency screening, decision recommendation, and portfolio dashboards — using **simulated data and a rule-based heuristic engine**.

> ⚠️ **Important disclaimer**
> The risk score, default probability, and decisions are **demonstration outputs of a transparent heuristic engine** running on borrower-*declared* inputs. This is **NOT** a trained or validated credit-risk model, it performs **no real PAN/Aadhaar/bureau/bank verification**, and it must never be used for real lending decisions.

---

## 1. What this prototype demonstrates

| Area | What works |
|---|---|
| **Borrower Portal** | Multi-section loan application form (personal / financial / loan info) with client-side validation, plus 3 one-click demo scenarios |
| **AI Risk Engine** | Transparent, configurable heuristic scoring (0–100, higher = riskier) from 7 weighted factors: DTI, disposable-income buffer, new-EMI burden, loan size vs income, income stability, existing obligations, fraud-flag penalty |
| **Financial Analysis** | Standard reducing-balance EMI at an illustrative 10.5% p.a., debt-to-income ratio, monthly disposable income, affordability status |
| **Fraud Detection** | 10 consistency checks (unrealistic age, invalid income, loan ≫ income, EMIs > income, implausible employment history, suspiciously low expenses, high debt, duplicates, missing employer…) — every flag is labelled *"suspicious inconsistency requiring verification"*, never as proven fraud |
| **Decision Engine** | APPROVED / MANUAL_REVIEW / REJECTED with an *"Why did LoanSense AI make this decision?"* explainable-AI section (3–5 data-driven reasons), recommended action, and next steps |
| **Admin Dashboard** | Stat cards, 3 live charts (risk-category donut, decision bar, purpose pie), recent-applications table, filters (All / Approved / Rejected / Manual Review / High Risk), search, click-through to any application's full analysis |
| **Extras** | Loading / error / empty states, responsive layout, in-memory store seeded with 7 realistic sample applications |

## 2. Tech stack

- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, Recharts, Lucide React, React Router
- **Backend:** Python + FastAPI + Pydantic v2, Uvicorn
- **Data:** In-memory store (`ApplicationStore`) — no PostgreSQL/Redis/Kafka. Restarting the API re-seeds the demo data.

## 3. Project structure

```
loansense-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint (CORS, lifespan seeding, /api/health)
│   │   ├── routes/                  # applications.py · analysis.py · dashboard.py · demo.py
│   │   ├── schemas/schemas.py       # Pydantic v2 request/response models
│   │   ├── services/
│   │   │   ├── config.py            # ⚙️ ALL scoring thresholds & weights (tune everything here)
│   │   │   ├── risk_engine.py       # EMI formula, factor curves, weighted composite score
│   │   │   ├── fraud_detection.py   # 10 consistency / fraud-suspicion checks
│   │   │   ├── decision_engine.py   # APPROVED / MANUAL_REVIEW / REJECTED + explanations
│   │   │   └── analysis_service.py  # Pipeline orchestrator
│   │   └── data/
│   │       ├── store.py             # Thread-safe in-memory store (IDs: LSA-2026-####)
│   │       └── demo_data.py         # 3 demo scenarios + 7 seed applications
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # ui/ · charts/ · fraud/ · analysis/ · layout/ · AppTable
│   │   ├── pages/                   # Overview · Applications · NewApplication · Detail · RiskAnalysis · FraudDetection
│   │   ├── services/api.ts          # Typed fetch client (proxied to FastAPI)
│   │   ├── lib/format.ts            # ₹ Indian formatting, dates, score colours
│   │   ├── types/index.ts           # TypeScript mirrors of the API schemas
│   │   └── App.tsx                  # Router
│   ├── vite.config.ts               # Dev server proxies /api → http://127.0.0.1:8000
│   └── package.json
├── run_demo.sh                      # Starts both servers with one command
└── README.md
```

## 4. Setup & execution (local machine)

**Prerequisites:** Python 3.11+, Node.js 18+, npm.

### One-command start

```bash
cd loansense-ai
bash run_demo.sh
```

### Manual start (two terminals)

**Terminal 1 — Backend**

```bash
cd loansense-ai/backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**

```bash
cd loansense-ai/frontend
npm install
npm run dev          # → http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to FastAPI on port 8000, so the whole app works from a single origin. Interactive API docs: http://localhost:8000/docs

> Demo data lives in memory. Restarting the backend restores the clean 7-application seed.

## 5. 3–5 minute faculty demonstration script

1. **Overview (dashboard)** — point out the stat cards, the three charts, and the recent-applications table (7 preloaded, realistically analysed samples).
2. **New Application** — load **Scenario A (Rahul Sharma)** via one click → **Analyze Application** → the results page shows **APPROVED · Low risk (score ≈ 7)**: healthy DTI (17.5%), comfortable disposable income, no flags. Walk through the risk-score gauge, EMI maths, score breakdown, explainable-AI reasons, and next steps.
3. Back to **New Application** → load **Scenario B (Priya Das)** → **MANUAL REVIEW · Medium risk (score ≈ 50)**: DTI ≈ 59%, disposable income ≈ ₹500/month — routed to a human underwriter with verification steps.
4. Load **Scenario C (Amit Kumar)** → **REJECTED · High risk (score ≈ 90)**: estimated EMI ₹64k against ₹30k income, negative disposable income, **two critical flags** (loan ≫ income; total EMIs exceed income).
5. **Fraud Detection** page — aggregate flag statistics and per-application flags (note the *"requires verification, not proof of fraud"* labelling).
6. **Loan Applications** — filter tabs (Approved / Rejected / Manual Review / High Risk), search, click any row → full analysis. The application you just submitted appears at the top of the table.
7. Optional: submit a second application with the **same borrower name** to demo the duplicate-detection flag.

> The demo scenarios are **not hardcoded** — outcomes are computed live from the financial inputs by the same engine that scores every application.

## 6. API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/applications` | Submit a new application → analysed + stored, returns full record |
| `POST` | `/api/analyze` | Dry-run risk analysis (returns decision, nothing stored) |
| `GET` | `/api/applications?filter=` | All applications, newest first. Filter: `all` `approved` `rejected` `manual_review` `high_risk` |
| `GET` | `/api/applications/{id}` | One application with its complete analysis |
| `GET` | `/api/dashboard/stats` | Stat totals + chart distributions |
| `GET` | `/api/demo/scenarios` | The three demo scenarios |
| `GET` | `/api/health` | Health check / engine status |

## 7. Scoring methodology (transparent by design)

`Risk score = Σ (factor score × weight)`, on 0–100 where **higher = riskier**. Weights and every threshold live in **`backend/app/services/config.py`**:

| Factor | Weight | Driven by |
|---|---|---|
| Debt-to-income ratio | 25% | `(existing EMI + estimated new EMI) / monthly income × 100` |
| Disposable-income buffer | 20% | `income − expenses − all EMIs`, as a share of income |
| New-EMI burden | 15% | estimated EMI ÷ income |
| Loan size vs income | 15% | loan amount ÷ annual income |
| Income stability | 10% | employment type, years, age |
| Existing obligations | 10% | existing EMI ÷ income |
| Fraud-flag penalty | 5% | info +5 · warning +15 · critical +40 (capped) |

**Classification:** `< 35` Low · `35–65` Medium · `> 65` High.
**Decision:** REJECTED if score > 65, any critical flag, negative disposable income, or DTI > 75% · APPROVED if score < 35 with healthy DTI (≤ 40%), adequate buffer (≥ 15%) and no warnings · otherwise MANUAL_REVIEW.
**Default probability:** illustrative mapping `2% + 85% × (score/100)²` — a heuristic, not a calibrated PD model.

## 8. Demo scenario expectations (verified)

| Scenario | Borrower | Engine result (live, not hardcoded) |
|---|---|---|
| A | Rahul Sharma — ₹90,000/mo, ₹5L / 60 mo | **APPROVED · Low risk** (score ≈ 7, DTI 17.5%) |
| B | Priya Das — ₹55,000/mo, ₹8L / 48 mo | **MANUAL REVIEW · Medium risk** (score ≈ 50, DTI 59%) |
| C | Amit Kumar — ₹30,000/mo, ₹30L / 60 mo | **REJECTED · High risk** (score ≈ 90, 2 critical flags) |

## 9. Limitations (intentional, for the academic scope)

- No real KYC / PAN / Aadhaar / bureau / bank integrations — all inputs are borrower-declared and simulated.
- The store is in-memory; submissions reset when the backend restarts.
- Single user, no auth; interest rate is a single illustrative value (no per-product pricing).
- The scoring engine is rule-based and fully auditable — deliberately *not* an ML model, so every demo result can be explained line-by-line.
