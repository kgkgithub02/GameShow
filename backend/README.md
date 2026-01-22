# Game Show Backend (FastAPI)

Python backend for the `frontend` game show UI. It mirrors the Supabase schema
and provides REST endpoints for game creation, joining, state updates, and buzz
actions.

## Requirements

- Python 3.10+

## Setup

```bash
cd /Users/gkamalan/projects/NewGameShow/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration

The server reads configuration from environment variables or a local config file.
Environment variables take precedence if both are set.
By default, it will read `~/.gameshow-llm.json`. You can override with `LLM_CONFIG_PATH`.

- `DATABASE_URL` (optional): SQLAlchemy database URL.
  - Default: `sqlite:///./gameshow.db`
- `ALLOWED_ORIGINS` (optional): Comma-separated list of CORS origins.
  - Default: `*`
- `LLM_PROVIDER` (optional): `openai` or `anthropic` (default: `openai`)
- `LLM_API_KEY` or `OPENAI_API_KEY` (required for OpenAI)
- `ANTHROPIC_API_KEY` (required for Anthropic)
- `LLM_BASE_URL` (optional): LLM API base URL.
  - OpenAI default: `https://api.openai.com/v1`
  - Anthropic default: `https://api.anthropic.com`
- `LLM_MODEL` (optional): LLM model name.
  - OpenAI default: `gpt-4o-mini`
  - Anthropic example: `claude-3-5-sonnet-20241022`
- `LLM_ANTHROPIC_VERSION` (optional): Anthropic API version header.
  - Default: `2023-06-01`

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## API Overview

- `POST /api/games` - create a game, teams, and initial state
- `POST /api/games/{code}/join` - join a game with team
- `GET /api/games/{game_id}` - game details with teams
- `GET /api/games/code/{code}` - game details by code
- `PATCH /api/games/{game_id}` - update game metadata
- `GET /api/games/{game_id}/state` - current state
- `PATCH /api/games/{game_id}/state` - update state
- `POST /api/teams/{team_id}/score` - update team score
- `POST /api/games/{game_id}/buzz` - submit a buzz
- `POST /api/games/{game_id}/buzz/reset` - reset buzz
- `POST /api/games/{game_id}/buzz/enable` - enable buzzing
- `POST /api/games/{game_id}/buzz/disable` - disable buzzing

## WebSocket

- `ws://localhost:8000/ws/games/{game_id}` - live updates (snapshot events)
