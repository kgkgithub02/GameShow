# Architecture

## Frontend (Vite + React)

- Single-page app in `frontend/`
- Host flow and player flow live under `frontend/src/app/`
- `GameController` handles round flow and scoring
- Each round has a host component and a player component
- Shared UI components under `frontend/src/app/components/`
- Game setup, review, and round instructions are separate screens

## Backend (FastAPI)

- REST API for games, teams, state, and buzz
- WebSocket endpoint for live snapshots
- SQLite storage by default
- SQLAlchemy models define Game, Team, Player, GameState, Buzz

## State Sync

- `useGameSync` fetches game, teams, players, and state
- WebSocket snapshots update the UI; REST polling is the fallback
- Update calls are lightweight PATCH requests to reduce payload size

## Data Model (Backend)

- **Game**: metadata, status, round index/type, difficulty
- **Team**: name, color, score
- **Player**: name, team, connection status
- **GameState**: live state for the active round
- **Buzz**: record of buzz events

## Round State Model

`GameState.round_data` holds per-round state such as timers, questions, and
round-specific phases. Each round writes to its own namespace, for example:
`round_data.trivia` or `round_data.quick_build`.

## API Overview

- `POST /api/games` - create game
- `POST /api/games/{code}/join` - join game
- `GET /api/games/{game_id}` - game with teams
- `GET /api/games/code/{code}` - game by code
- `PATCH /api/games/{game_id}` - update game
- `GET /api/games/{game_id}/state` - get state
- `PATCH /api/games/{game_id}/state` - update state
- `POST /api/teams/{team_id}/score` - add points
- `POST /api/games/{game_id}/buzz` - buzz in
- `POST /api/games/{game_id}/buzz/reset` - reset buzz
- `POST /api/games/{game_id}/buzz/enable` - enable buzzing
- `POST /api/games/{game_id}/buzz/disable` - disable buzzing

## WebSocket

- `ws://<host>/ws/games/{game_id}` - snapshot updates

## Security Notes

- Host PIN is hashed per game before being stored in state.
- CORS is configured via `ALLOWED_ORIGINS`.
