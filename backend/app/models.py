import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .database import Base


def _uuid_str() -> str:
    return str(uuid.uuid4())


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    code: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="waiting")
    current_round: Mapped[int] = mapped_column(Integer, default=0)
    current_round_type: Mapped[str | None] = mapped_column(String(50))
    difficulty: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now()
    )

    teams: Mapped[list["Team"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )
    players: Mapped[list["Player"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )
    game_state: Mapped["GameState"] = relationship(
        back_populates="game", cascade="all, delete-orphan", uselist=False
    )
    buzzes: Mapped[list["Buzz"]] = relationship(
        back_populates="game", cascade="all, delete-orphan"
    )


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    game_id: Mapped[str] = mapped_column(ForeignKey("games.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    game: Mapped["Game"] = relationship(back_populates="teams")
    players: Mapped[list["Player"]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )
    buzzes: Mapped[list["Buzz"]] = relationship(back_populates="team")


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    game_id: Mapped[str] = mapped_column(ForeignKey("games.id"), nullable=False)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    connected: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    game: Mapped["Game"] = relationship(back_populates="players")
    team: Mapped["Team"] = relationship(back_populates="players")
    buzzes: Mapped[list["Buzz"]] = relationship(back_populates="player")


class GameState(Base):
    __tablename__ = "game_state"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    game_id: Mapped[str] = mapped_column(
        ForeignKey("games.id"), nullable=False, unique=True
    )
    current_question: Mapped[str | None] = mapped_column(Text)
    current_category: Mapped[str | None] = mapped_column(String(100))
    current_points: Mapped[int | None] = mapped_column(Integer)
    time_remaining: Mapped[int | None] = mapped_column(Integer)
    can_buzz: Mapped[bool] = mapped_column(Boolean, default=False)
    buzzed_team_id: Mapped[str | None] = mapped_column(ForeignKey("teams.id"))
    current_turn_team_id: Mapped[str | None] = mapped_column(ForeignKey("teams.id"))
    round_data: Mapped[dict | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now()
    )

    game: Mapped["Game"] = relationship(back_populates="game_state")


class Buzz(Base):
    __tablename__ = "buzzes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    game_id: Mapped[str] = mapped_column(ForeignKey("games.id"), nullable=False)
    team_id: Mapped[str | None] = mapped_column(ForeignKey("teams.id"))
    player_id: Mapped[str | None] = mapped_column(ForeignKey("players.id"))
    question_text: Mapped[str | None] = mapped_column(Text)
    was_first: Mapped[bool | None] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    game: Mapped["Game"] = relationship(back_populates="buzzes")
    team: Mapped["Team"] = relationship(back_populates="buzzes")
    player: Mapped["Player"] = relationship(back_populates="buzzes")
