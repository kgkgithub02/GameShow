# API Reference

Base URL examples:
- Local: `http://localhost:8000`
- Production: `https://<backend-host>`

All JSON responses use UTF-8. Errors are JSON with `detail`.

## REST Endpoints

### Create Game

`POST /api/games`

Request body:
```json
{
  "teams": [{ "name": "Team A", "color": "#3b82f6" }],
  "difficulty": "medium",
  "rounds": ["trivia-buzz", "lightning"],
  "host_pin": "1234"
}
```

Response:
```json
{
  "game": { "id": "...", "code": "PINKWAVE", "status": "waiting", "current_round": 0 },
  "teams": [{ "id": "...", "name": "Team A", "color": "#3b82f6", "score": 0, "players": [] }]
}
```

### Join Game (player)

`POST /api/games/{code}/join`

Request body:
```json
{ "team_id": "<team-id>", "player_name": "Alex" }
```

Response:
```json
{ "id": "<player-id>", "name": "Alex", "team_id": "<team-id>", "game_id": "<game-id>", "connected": true }
```

### Get Game by ID

`GET /api/games/{game_id}`

Response:
```json
{ "game": { "id": "...", "code": "PINKWAVE", "status": "waiting" }, "teams": [ ... ] }
```

### Get Game by Code

`GET /api/games/code/{code}`

Response:
```json
{ "game": { "id": "...", "code": "PINKWAVE", "status": "waiting" }, "teams": [ ... ] }
```

### Get Host Game by Code (PIN)

`POST /api/games/code/{code}/host`

Request body:
```json
{ "host_pin": "1234" }
```

Response:
```json
{ "game": { "id": "...", "code": "PINKWAVE", "status": "waiting" }, "teams": [ ... ] }
```

### Update Game Metadata

`PATCH /api/games/{game_id}`

Request body:
```json
{ "status": "in_progress", "current_round": 1, "current_round_type": "trivia-buzz" }
```

### Get Game State

`GET /api/games/{game_id}/state`

Response:
```json
{
  "game_id": "...",
  "current_question": "Question text",
  "current_category": "General",
  "current_points": 100,
  "time_remaining": 5,
  "can_buzz": true,
  "buzzed_team_id": null,
  "current_turn_team_id": null,
  "round_data": {}
}
```

### Update Game State

`PATCH /api/games/{game_id}/state`

Request body (partial):
```json
{
  "current_question": "Question text",
  "can_buzz": true,
  "round_data": {
    "trivia": { "show_answer": false, "buzzed_player_id": null }
  }
}
```

### Update Team Score

`POST /api/teams/{team_id}/score`

Request body:
```json
{ "points": 100 }
```

### Buzz

`POST /api/games/{game_id}/buzz`

Request body:
```json
{
  "team_id": "<team-id>",
  "player_id": "<player-id>",
  "player_name": "Alex",
  "question_text": "Question text"
}
```

Response:
```json
{ "success": true }
```

Only the first buzz is accepted; later buzzes return `success: false`.

### Reset Buzz

`POST /api/games/{game_id}/buzz/reset`

### Enable Buzzing

`POST /api/games/{game_id}/buzz/enable`

### Disable Buzzing

`POST /api/games/{game_id}/buzz/disable`

## WebSocket

`ws://<host>/ws/games/{game_id}`

Message type: `snapshot`
```json
{
  "type": "snapshot",
  "data": {
    "game": { ... },
    "teams": [ ... ],
    "players": [ ... ],
    "game_state": { ... }
  }
}
```

## Round Data Payloads

`round_data` contains round-specific data. Common keys:

### `trivia`
```json
{
  "answer": "Correct Answer",
  "show_answer": false,
  "buzzed_player_id": null,
  "buzzed_player_name": null
}
```

### `lightning`
```json
{
  "question": "Question text",
  "question_number": 3,
  "total_questions": 10,
  "time_remaining": 42,
  "correct_count": 2,
  "incorrect_count": 1,
  "points_this_round": 100,
  "round_complete": false
}
```

### `quick_build`
```json
{
  "challenge": "Build the tallest structure",
  "time_remaining": 10,
  "total_time": 60,
  "phase": "building",
  "winner_team_id": null,
  "tie": false
}
```

### `connect4`
```json
{
  "question": "Question text",
  "selected_column": 2,
  "selected_square": 1,
  "point_value": 200,
  "board": [],
  "column_themes": ["general", "science", "history", "movies"]
}
```

### `guess_number`
```json
{
  "prompt": "Guess the number of ...",
  "correct_answer": 42,
  "time_remaining": 0
}
```

### `blind_draw`
```json
{
  "phase": "drawing",
  "word": "tree",
  "time_remaining": 30
}
```

### `dump_charades`
```json
{
  "phase": "acting",
  "word": "juggling",
  "actor_player_id": "<player-id>",
  "actor_team_id": "<team-id>",
  "time_remaining": 20,
  "result": null
}
```
