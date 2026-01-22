import hashlib
import random
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas


GAME_CODE_WORDS = [
    "PINK",
    "SAND",
    "MOON",
    "STAR",
    "WAVE",
    "FIRE",
    "SNOW",
    "MIST",
    "ROSE",
    "GOLD",
    "LIME",
    "BLUE",
    "DUNE",
    "COVE",
    "BIRD",
    "FROG",
    "WIND",
    "RAIN",
    "LEAF",
    "DUSK",
    "DAWN",
    "GLOW",
    "ECHO",
    "MOSS",
    "PEAK",
    "LAKE",
    "CLUE",
    "SHIP",
    "LION",
    "WOLF",
]


def generate_game_code(length: int = 8) -> str:
    if length != 8:
        raise ValueError("Game code length must be 8")
    pool = [word for word in GAME_CODE_WORDS if len(word) == 4]
    if not pool:
        raise ValueError("No valid 4-letter words available for game codes")
    first = random.choice(pool)
    second = random.choice(pool)
    while second == first:
        second = random.choice(pool)
    return f"{first}{second}"


def create_game(db: Session, payload: schemas.GameCreate) -> tuple[models.Game, list[models.Team]]:
    for _ in range(10):
        code = generate_game_code()
        exists = db.execute(select(models.Game).where(models.Game.code == code)).scalar_one_or_none()
        if not exists:
            break
    else:
        raise ValueError("Unable to generate unique game code")

    game = models.Game(
        code=code,
        difficulty=payload.difficulty,
        status="waiting",
        current_round=0,
        current_round_type=payload.rounds[0],
    )
    db.add(game)
    db.flush()

    teams: list[models.Team] = []
    for team in payload.teams:
        team_row = models.Team(
            game_id=game.id,
            name=team.name,
            color=team.color,
            score=0,
        )
        db.add(team_row)
        teams.append(team_row)

    host_pin_hash = None
    if payload.host_pin:
        host_pin_hash = _hash_host_pin(game.id, payload.host_pin)

    state = models.GameState(
        game_id=game.id,
        can_buzz=False,
        round_data={
            "game_setup": {
                "rounds": payload.rounds,
                "round_settings": {},
                "difficulty": payload.difficulty,
                "host_pin_hash": host_pin_hash,
            }
        },
    )
    db.add(state)
    db.commit()
    db.refresh(game)
    for team_row in teams:
        db.refresh(team_row)

    return game, teams


def _hash_host_pin(game_id: str, host_pin: str) -> str:
    payload = f"{game_id}:{host_pin}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def get_game_by_code(db: Session, code: str) -> models.Game | None:
    return db.execute(select(models.Game).where(models.Game.code == code)).scalar_one_or_none()


def get_game(db: Session, game_id: str) -> models.Game | None:
    return db.execute(select(models.Game).where(models.Game.id == game_id)).scalar_one_or_none()


def update_game(db: Session, game_id: str, updates: schemas.GameUpdate) -> models.Game:
    game = get_game(db, game_id)
    if not game:
        raise ValueError("Game not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(game, key, value)
    game.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(game)
    return game


def get_teams_for_game(db: Session, game_id: str) -> list[models.Team]:
    return list(db.execute(select(models.Team).where(models.Team.game_id == game_id)).scalars())


def get_players_for_game(db: Session, game_id: str) -> list[models.Player]:
    return list(db.execute(select(models.Player).where(models.Player.game_id == game_id)).scalars())


def create_player(db: Session, game_id: str, team_id: str, player_name: str) -> models.Player:
    player = models.Player(
        game_id=game_id,
        team_id=team_id,
        name=player_name,
        connected=True,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


def set_player_connected(db: Session, player_id: str, connected: bool) -> models.Player:
    player = db.execute(select(models.Player).where(models.Player.id == player_id)).scalar_one_or_none()
    if not player:
        raise ValueError("Player not found")
    player.connected = connected
    player.last_seen = datetime.utcnow()
    db.commit()
    db.refresh(player)
    return player


def get_game_state(db: Session, game_id: str) -> models.GameState | None:
    return db.execute(select(models.GameState).where(models.GameState.game_id == game_id)).scalar_one_or_none()


def update_game_state(db: Session, game_id: str, updates: schemas.GameStateUpdate) -> models.GameState:
    state = get_game_state(db, game_id)
    if not state:
        raise ValueError("Game state not found")

    update_data = updates.model_dump(exclude_unset=True)
    if "round_data" in update_data:
        incoming = update_data.pop("round_data")
        if incoming is None:
            state.round_data = None
        else:
            existing = state.round_data or {}
            state.round_data = _deep_merge_dicts(existing, incoming)
    for key, value in update_data.items():
        setattr(state, key, value)
    state.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(state)
    return state


def _deep_merge_dicts(base: dict, updates: dict) -> dict:
    merged = dict(base)
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge_dicts(merged[key], value)
        else:
            merged[key] = value
    return merged


def update_team_score(db: Session, team_id: str, points: int) -> models.Team:
    team = db.execute(select(models.Team).where(models.Team.id == team_id)).scalar_one_or_none()
    if not team:
        raise ValueError("Team not found")

    team.score = max(0, team.score + points)
    db.commit()
    db.refresh(team)
    return team


def send_buzz(
    db: Session,
    game_id: str,
    team_id: str,
    player_id: str | None,
    player_name: str | None,
    question_text: str | None,
) -> tuple[bool, str | None]:
    state = get_game_state(db, game_id)
    if not state:
        return False, "Game state not found"

    if not state.can_buzz or state.buzzed_team_id:
        return False, "Cannot buzz right now"

    resolved_player_name = player_name
    if player_id and not resolved_player_name:
        player = (
            db.execute(select(models.Player).where(models.Player.id == player_id))
            .scalar_one_or_none()
        )
        if player:
            resolved_player_name = player.name

    round_data = state.round_data or {}
    trivia_data = dict(round_data.get("trivia") or {})
    trivia_data["buzzed_player_id"] = player_id
    trivia_data["buzzed_player_name"] = resolved_player_name
    round_data["trivia"] = trivia_data

    state.buzzed_team_id = team_id
    state.can_buzz = False
    state.updated_at = datetime.utcnow()
    state.round_data = round_data

    buzz = models.Buzz(
        game_id=game_id,
        team_id=team_id,
        player_id=player_id,
        question_text=question_text,
        was_first=True,
    )
    db.add(buzz)
    db.commit()
    return True, None


def reset_buzz(db: Session, game_id: str, can_buzz: bool = True) -> models.GameState:
    state = get_game_state(db, game_id)
    if not state:
        raise ValueError("Game state not found")

    state.buzzed_team_id = None
    state.can_buzz = can_buzz
    state.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    return state


def set_buzzing(db: Session, game_id: str, can_buzz: bool) -> models.GameState:
    state = get_game_state(db, game_id)
    if not state:
        raise ValueError("Game state not found")

    state.can_buzz = can_buzz
    if can_buzz:
        state.buzzed_team_id = None
    state.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(state)
    return state
