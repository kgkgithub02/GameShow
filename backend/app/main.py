import os
from typing import Generator

import httpx
import logging

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, SessionLocal, engine
from .llm import generate_questions, regenerate_question
from .ws import manager

logger = logging.getLogger(__name__)
uvicorn_logger = logging.getLogger("uvicorn.error")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(title="Game Show Backend", version="1.0.0")

    allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
    origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
    if not origins:
        origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        from .llm import get_llm_summary
        provider, base_url, model, config_path, using_env, key_present = get_llm_summary()
        source = "env" if using_env else "file"
        logger.info(
            "LLM config provider=%s base_url=%s model=%s source=%s config_path=%s key_present=%s",
            provider,
            base_url,
            model,
            source,
            config_path,
            key_present,
        )
        uvicorn_logger.info(
            "LLM config provider=%s base_url=%s model=%s source=%s config_path=%s key_present=%s",
            provider,
            base_url,
            model,
            source,
            config_path,
            key_present,
        )

    def _normalize_code(raw: str) -> str:
        return "".join([c for c in raw.upper() if c.isalpha()])

    @app.get("/api/health")
    def health_check() -> dict:
        return {"status": "ok"}

    @app.post("/api/questions/generate", response_model=schemas.GeneratedQuestions)
    async def generate_questions_endpoint(
        payload: schemas.GenerateQuestionsRequest,
    ) -> schemas.GeneratedQuestions:
        try:
            return await generate_questions(payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        except httpx.HTTPError as exc:
            logger.exception("Question generation failed")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    @app.post("/api/questions/regenerate", response_model=schemas.RegenerateQuestionResponse)
    async def regenerate_question_endpoint(
        payload: schemas.RegenerateQuestionRequest,
    ) -> schemas.RegenerateQuestionResponse:
        try:
            return await regenerate_question(payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        except httpx.HTTPError as exc:
            logger.exception("Question regeneration failed")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    async def broadcast_snapshot(db: Session, game_id: str) -> None:
        game = crud.get_game(db, game_id)
        state = crud.get_game_state(db, game_id)
        if not game:
            return
        teams = crud.get_teams_for_game(db, game_id)
        players = crud.get_players_for_game(db, game_id)
        payload = {
            "type": "snapshot",
            "data": {
                "game": schemas.GameOut.model_validate(game).model_dump(),
                "teams": [
                    schemas.TeamOut(
                        id=team.id,
                        name=team.name,
                        color=team.color,
                        score=team.score,
                        players=[player.name for player in team.players],
                    ).model_dump()
                    for team in teams
                ],
                "game_state": schemas.GameStateOut.model_validate(state).model_dump()
                if state
                else None,
                "players": [
                    schemas.PlayerStatusOut.model_validate(player).model_dump()
                    for player in players
                ],
            },
        }
        await manager.broadcast(game_id, payload)

    @app.websocket("/ws/games/{game_id}")
    async def game_ws(game_id: str, websocket: WebSocket) -> None:
        await manager.connect(game_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(game_id, websocket)

    @app.post("/api/games", response_model=schemas.GameCreateResponse)
    async def create_game(payload: schemas.GameCreate, db: Session = Depends(get_db)) -> schemas.GameCreateResponse:
        try:
            game, teams = crud.create_game(db, payload)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

        team_out = [
            schemas.TeamOut(
                id=team.id,
                name=team.name,
                color=team.color,
                score=team.score,
                players=[player.name for player in team.players],
            )
            for team in teams
        ]
        response = schemas.GameCreateResponse(
            game=schemas.GameOut.model_validate(game),
            teams=team_out,
        )
        await broadcast_snapshot(db, game.id)
        return response

    @app.post("/api/games/{code}/join", response_model=schemas.PlayerOut)
    async def join_game(
        code: str,
        payload: schemas.PlayerJoinRequest,
        db: Session = Depends(get_db),
    ) -> schemas.PlayerOut:
        game = crud.get_game_by_code(db, _normalize_code(code))
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        team = db.get(models.Team, payload.team_id)
        if not team or team.game_id != game.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid team")

        player = crud.create_player(db, game.id, payload.team_id, payload.player_name)
        await broadcast_snapshot(db, game.id)
        return schemas.PlayerOut.model_validate(player)

    @app.get("/api/games/{game_id}", response_model=schemas.GameWithTeams)
    def get_game(game_id: str, db: Session = Depends(get_db)) -> schemas.GameWithTeams:
        game = crud.get_game(db, game_id)
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        teams = crud.get_teams_for_game(db, game_id)
        team_out = [
            schemas.TeamOut(
                id=team.id,
                name=team.name,
                color=team.color,
                score=team.score,
                players=[player.name for player in team.players],
            )
            for team in teams
        ]
        return schemas.GameWithTeams(game=schemas.GameOut.model_validate(game), teams=team_out)

    @app.patch("/api/games/{game_id}", response_model=schemas.GameOut)
    async def update_game(
        game_id: str,
        updates: schemas.GameUpdate,
        db: Session = Depends(get_db),
    ) -> schemas.GameOut:
        try:
            game = crud.update_game(db, game_id, updates)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, game_id)
        return schemas.GameOut.model_validate(game)

    @app.get("/api/games/code/{code}", response_model=schemas.GameWithTeams)
    def get_game_by_code(code: str, db: Session = Depends(get_db)) -> schemas.GameWithTeams:
        game = crud.get_game_by_code(db, _normalize_code(code))
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        teams = crud.get_teams_for_game(db, game.id)
        team_out = [
            schemas.TeamOut(
                id=team.id,
                name=team.name,
                color=team.color,
                score=team.score,
                players=[player.name for player in team.players],
            )
            for team in teams
        ]
        return schemas.GameWithTeams(game=schemas.GameOut.model_validate(game), teams=team_out)

    @app.post("/api/games/code/{code}/host", response_model=schemas.GameWithTeams)
    def get_game_by_code_host(
        code: str,
        payload: schemas.HostJoinRequest,
        db: Session = Depends(get_db),
    ) -> schemas.GameWithTeams:
        game = crud.get_game_by_code(db, _normalize_code(code))
        if not game:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        state = crud.get_game_state(db, game.id)
        round_data = (state.round_data or {}) if state else {}
        setup_data = dict(round_data.get("game_setup") or {})
        host_pin_hash = setup_data.get("host_pin_hash")
        if not host_pin_hash:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Host pin not set")

        incoming_hash = crud._hash_host_pin(game.id, payload.host_pin)
        if incoming_hash != host_pin_hash:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid host pin")

        teams = crud.get_teams_for_game(db, game.id)
        team_out = [
            schemas.TeamOut(
                id=team.id,
                name=team.name,
                color=team.color,
                score=team.score,
                players=[player.name for player in team.players],
            )
            for team in teams
        ]
        return schemas.GameWithTeams(game=schemas.GameOut.model_validate(game), teams=team_out)


    @app.get("/api/games/{game_id}/teams", response_model=list[schemas.TeamOut])
    def get_teams(game_id: str, db: Session = Depends(get_db)) -> list[schemas.TeamOut]:
        teams = crud.get_teams_for_game(db, game_id)
        if not teams:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game or teams not found")
        return [
            schemas.TeamOut(
                id=team.id,
                name=team.name,
                color=team.color,
                score=team.score,
                players=[player.name for player in team.players],
            )
            for team in teams
        ]

    @app.get("/api/games/{game_id}/players", response_model=list[schemas.PlayerStatusOut])
    def get_players(game_id: str, db: Session = Depends(get_db)) -> list[schemas.PlayerStatusOut]:
        players = crud.get_players_for_game(db, game_id)
        return [schemas.PlayerStatusOut.model_validate(player) for player in players]

    @app.get("/api/games/{game_id}/state", response_model=schemas.GameStateOut)
    def get_game_state(game_id: str, db: Session = Depends(get_db)) -> schemas.GameStateOut:
        state = crud.get_game_state(db, game_id)
        if not state:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game state not found")
        return schemas.GameStateOut.model_validate(state)

    @app.patch("/api/games/{game_id}/state", response_model=schemas.GameStateOut)
    async def update_game_state(
        game_id: str,
        updates: schemas.GameStateUpdate,
        db: Session = Depends(get_db),
    ) -> schemas.GameStateOut:
        try:
            state = crud.update_game_state(db, game_id, updates)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, game_id)
        return schemas.GameStateOut.model_validate(state)

    @app.post("/api/teams/{team_id}/score", response_model=schemas.TeamOut)
    async def update_score(
        team_id: str,
        payload: schemas.TeamScoreUpdate,
        db: Session = Depends(get_db),
    ) -> schemas.TeamOut:
        try:
            team = crud.update_team_score(db, team_id, payload.points)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, team.game_id)
        return schemas.TeamOut(
            id=team.id,
            name=team.name,
            color=team.color,
            score=team.score,
            players=[player.name for player in team.players],
        )

    @app.post("/api/games/{game_id}/buzz", response_model=schemas.BuzzResponse)
    async def send_buzz(
        game_id: str,
        payload: schemas.BuzzRequest,
        db: Session = Depends(get_db),
    ) -> schemas.BuzzResponse:
        success, message = crud.send_buzz(
            db,
            game_id=game_id,
            team_id=payload.team_id,
            player_id=payload.player_id,
            player_name=payload.player_name,
            question_text=payload.question_text,
        )
        if not success:
            return schemas.BuzzResponse(success=False, message=message)
        await broadcast_snapshot(db, game_id)
        return schemas.BuzzResponse(success=True)

    @app.post("/api/games/{game_id}/buzz/reset", response_model=schemas.GameStateOut)
    async def reset_buzz(game_id: str, db: Session = Depends(get_db)) -> schemas.GameStateOut:
        try:
            state = crud.reset_buzz(db, game_id, can_buzz=True)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, game_id)
        return schemas.GameStateOut.model_validate(state)

    @app.post("/api/games/{game_id}/buzz/enable", response_model=schemas.GameStateOut)
    async def enable_buzzing(game_id: str, db: Session = Depends(get_db)) -> schemas.GameStateOut:
        try:
            state = crud.set_buzzing(db, game_id, can_buzz=True)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, game_id)
        return schemas.GameStateOut.model_validate(state)

    @app.post("/api/games/{game_id}/buzz/disable", response_model=schemas.GameStateOut)
    async def disable_buzzing(game_id: str, db: Session = Depends(get_db)) -> schemas.GameStateOut:
        try:
            state = crud.set_buzzing(db, game_id, can_buzz=False)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, game_id)
        return schemas.GameStateOut.model_validate(state)

    @app.post("/api/players/{player_id}/disconnect", response_model=schemas.PlayerStatusOut)
    async def disconnect_player(
        player_id: str,
        db: Session = Depends(get_db),
    ) -> schemas.PlayerStatusOut:
        try:
            player = crud.set_player_connected(db, player_id, connected=False)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
        await broadcast_snapshot(db, player.game_id)
        return schemas.PlayerStatusOut.model_validate(player)

    return app


app = create_app()
