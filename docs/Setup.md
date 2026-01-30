# Setup

## Requirements

- Node.js 18+
- Python 3.10+

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration

Backend config (env or JSON file):
- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `LLM_PROVIDER`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`

Frontend config (env):
- `VITE_API_URL`
- `VITE_WS_URL` (optional)

## UI Tests (Playwright)

Requirements:
- Backend running on `http://localhost:8000`
- Frontend dev server started by Playwright

Install:
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

Run:
```bash
npm run test:e2e
```

Optional env:
- `E2E_API_URL` (default: `http://localhost:8000`)
- `E2E_BASE_URL` (default: `http://localhost:5173`)
