from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Difficulty = Literal["easy", "medium", "medium-hard", "hard"]
RoundType = Literal[
    "trivia-buzz",
    "lightning",
    "quick-build",
    "connect-4",
    "guess-number",
    "blind-draw",
    "dump-charades",
]


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(..., min_length=1, max_length=20)


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    color: str
    score: int
    players: list[str] = Field(default_factory=list)


class GameCreate(BaseModel):
    teams: list[TeamCreate] = Field(..., min_length=1)
    difficulty: Difficulty
    rounds: list[RoundType] = Field(..., min_length=1)
    host_pin: str | None = Field(default=None, min_length=4, max_length=20)


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    status: str
    current_round: int
    current_round_type: str | None
    difficulty: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class GameUpdate(BaseModel):
    status: str | None = None
    current_round: int | None = None
    current_round_type: str | None = None
    difficulty: str | None = None


class GameCreateResponse(BaseModel):
    game: GameOut
    teams: list[TeamOut]


class GameWithTeams(BaseModel):
    game: GameOut
    teams: list[TeamOut]


class PlayerJoinRequest(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=100)
    team_id: str


class HostJoinRequest(BaseModel):
    host_pin: str = Field(..., min_length=4, max_length=20)


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    team_id: str
    game_id: str
    connected: bool


class GameStateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    game_id: str
    current_question: str | None
    current_category: str | None
    current_points: int | None
    time_remaining: int | None
    can_buzz: bool
    buzzed_team_id: str | None
    current_turn_team_id: str | None
    round_data: dict | None
    updated_at: datetime | None = None


class GameStateUpdate(BaseModel):
    current_question: str | None = None
    current_category: str | None = None
    current_points: int | None = None
    time_remaining: int | None = None
    can_buzz: bool | None = None
    buzzed_team_id: str | None = None
    current_turn_team_id: str | None = None
    round_data: dict | None = None


class TeamScoreUpdate(BaseModel):
    points: int


class BuzzRequest(BaseModel):
    team_id: str
    player_id: str | None = None
    player_name: str | None = None
    question_text: str | None = None


class BuzzResponse(BaseModel):
    success: bool
    message: str | None = None


class PlayerStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    team_id: str
    game_id: str
    connected: bool


class RoundSettingsIn(BaseModel):
    trivia_buzz_questions: int | None = Field(default=None, alias="triviaBuzzQuestions")
    trivia_buzz_difficulty: Difficulty | None = Field(default=None, alias="triviaBuzzDifficulty")
    lightning_seconds: int | None = Field(default=None, alias="lightningSeconds")
    lightning_difficulty: Difficulty | None = Field(default=None, alias="lightningDifficulty")
    quick_build_seconds: int | None = Field(default=None, alias="quickBuildSeconds")
    guess_number_seconds: int | None = Field(default=None, alias="guessNumberSeconds")
    guess_number_questions: int | None = Field(default=None, alias="guessNumberQuestions")
    guess_number_difficulty: Difficulty | None = Field(default=None, alias="guessNumberDifficulty")
    connect4_themes: list[str] | None = Field(default=None, alias="connect4Themes")
    connect4_difficulty: Difficulty | None = Field(default=None, alias="connect4Difficulty")
    blind_draw_seconds: int | None = Field(default=None, alias="blindDrawSeconds")
    blind_draw_difficulty: Difficulty | None = Field(default=None, alias="blindDrawDifficulty")
    blind_draw_word_count: int | None = Field(default=None, alias="blindDrawWordCount")
    dump_charades_seconds: int | None = Field(default=None, alias="dumpCharadesSeconds")
    dump_charades_difficulty: Difficulty | None = Field(default=None, alias="dumpCharadesDifficulty")
    dump_charades_category: str | None = Field(default=None, alias="dumpCharadesCategory")


class QuestionOut(BaseModel):
    id: str
    text: str
    answer: str
    difficulty: Difficulty
    category: str | None = None


class GuessNumberQuestion(BaseModel):
    question: str
    answer: int


class Connect4Question(BaseModel):
    column: int
    row: int
    question: QuestionOut


class GeneratedQuestions(BaseModel):
    triviaBuzz: list[QuestionOut] | None = None
    lightning: list[QuestionOut] | None = None
    guessNumber: list[GuessNumberQuestion] | None = None
    connect4: list[Connect4Question] | None = None
    blindDraw: list[str] | None = None
    dumpCharades: list[str] | None = None


class GenerateQuestionsRequest(BaseModel):
    rounds: list[RoundType]
    round_settings: RoundSettingsIn = Field(alias="roundSettings")


class RegenerateQuestionRequest(BaseModel):
    round_type: RoundType
    difficulty: Difficulty | None = None
    category: str | None = None
    column: int | None = None
    row: int | None = None


class RegenerateQuestionResponse(BaseModel):
    round_type: RoundType
    question: QuestionOut | None = None
    guess_number: GuessNumberQuestion | None = None
    connect4: Connect4Question | None = None
    word: str | None = None
