import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any

import httpx

from . import schemas

logger = logging.getLogger(__name__)


def _resolve_config_path() -> Path:
    env_path = os.getenv("LLM_CONFIG_PATH")
    if env_path:
        return Path(env_path).expanduser()
    return Path.home() / ".gameshow-llm.json"


def _load_config() -> dict[str, str]:
    config_path = _resolve_config_path()
    if not config_path.exists():
        return {}
    try:
        with config_path.open("r", encoding="utf-8") as handle:
            raw = json.load(handle)
        if isinstance(raw, dict):
            return {str(k): str(v) for k, v in raw.items()}
    except (OSError, json.JSONDecodeError):
        return {}
    return {}


def _get_llm_config() -> tuple[str, str, str, str, str, bool]:
    config = _load_config()
    config_path = str(_resolve_config_path())
    provider = (os.getenv("LLM_PROVIDER") or config.get("LLM_PROVIDER") or "openai").lower()
    api_key = (
        os.getenv("LLM_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or config.get("LLM_API_KEY")
        or config.get("OPENAI_API_KEY")
    )
    if not api_key and provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY") or config.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("Missing LLM_API_KEY/OPENAI_API_KEY/ANTHROPIC_API_KEY")
    base_url = (
        os.getenv("LLM_BASE_URL")
        or config.get("LLM_BASE_URL")
        or "https://api.openai.com/v1"
    ).rstrip("/")
    model = os.getenv("LLM_MODEL") or config.get("LLM_MODEL") or "gpt-4o-mini"
    using_env = any(
        os.getenv(key)
        for key in (
            "LLM_PROVIDER",
            "LLM_API_KEY",
            "OPENAI_API_KEY",
            "ANTHROPIC_API_KEY",
            "LLM_BASE_URL",
            "LLM_MODEL",
            "LLM_ANTHROPIC_VERSION",
        )
    )
    return provider, api_key, base_url, model, config_path, using_env


def _add_ids_to_questions(questions: list[schemas.QuestionOut]) -> list[schemas.QuestionOut]:
    updated: list[schemas.QuestionOut] = []
    for question in questions:
        updated.append(
            schemas.QuestionOut(
                id=str(uuid.uuid4()),
                text=question.text,
                answer=question.answer,
                difficulty=question.difficulty,
                category=question.category,
            )
        )
    return updated


async def _call_llm(prompt: str) -> Any:
    provider, api_key, base_url, model, _, _ = _get_llm_config()

    if provider == "anthropic":
        url = f"{base_url}/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": os.getenv("LLM_ANTHROPIC_VERSION")
            or _load_config().get("LLM_ANTHROPIC_VERSION")
            or "2023-06-01",
        }
        payload = {
            "model": model,
            "max_tokens": 2048,
            "system": "You are a quiz writer. Always respond with valid JSON only.",
            "messages": [{"role": "user", "content": prompt}],
        }
        logger.info("LLM request provider=%s model=%s url=%s", provider, model, url)
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                status = getattr(exc.response, "status_code", None)
                text = getattr(exc.response, "text", "")
                logger.exception("LLM request failed status=%s body=%s", status, text[:2000])
                raise
        data = response.json()
        content_blocks = data.get("content") or []
        text = content_blocks[0].get("text") if content_blocks else ""
        if not text:
            logger.error("LLM response missing text content: %s", data)
            raise ValueError("LLM response missing text content")
        try:
            return json.loads(_strip_code_fences(text))
        except json.JSONDecodeError as exc:
            logger.error("LLM returned invalid JSON: %s", text[:2000])
            raise ValueError("LLM returned invalid JSON") from exc

    url = f"{base_url}/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a quiz writer. Always respond with valid JSON only.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }
    logger.info("LLM request provider=%s model=%s url=%s", provider, model, url)
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            status = getattr(exc.response, "status_code", None)
            text = getattr(exc.response, "text", "")
            logger.exception("LLM request failed status=%s body=%s", status, text[:2000])
            raise
    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        logger.error("LLM response missing content: %s", data)
        raise ValueError("LLM response missing content")
    try:
        return json.loads(_strip_code_fences(content))
    except json.JSONDecodeError as exc:
        logger.error("LLM returned invalid JSON: %s", content[:2000])
        raise ValueError("LLM returned invalid JSON") from exc


def _strip_code_fences(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        parts = stripped.splitlines()
        if parts and parts[0].startswith("```"):
            parts = parts[1:]
        if parts and parts[-1].startswith("```"):
            parts = parts[:-1]
        return "\n".join(parts).strip()
    return stripped


def _is_connect4_question(text: str, answer: str | None, category: str | None) -> bool:
    combined = " ".join(filter(None, [text, answer or "", category or ""])).lower()
    banned_phrases = [
        "connect 4",
        "connect-4",
        "connect four",
        "four in a row",
    ]
    return any(phrase in combined for phrase in banned_phrases)


async def generate_questions(payload: schemas.GenerateQuestionsRequest) -> schemas.GeneratedQuestions:
    rounds = payload.rounds
    settings = payload.round_settings
    generated = schemas.GeneratedQuestions()

    if "trivia-buzz" in rounds:
        count = settings.trivia_buzz_questions or 10
        difficulty = settings.trivia_buzz_difficulty or "medium-hard"
        prompt = (
            "Generate trivia questions as JSON with this schema: "
            '{"questions":[{"text":"...", "answer":"...", "difficulty":"", "category":""}]}. '
            f"Generate {count} questions. difficulty must be '{difficulty}'."
        )
        data = await _call_llm(prompt)
        questions = [schemas.QuestionOut(id="tmp", **q) for q in data["questions"]]
        generated.triviaBuzz = _add_ids_to_questions(questions)

    if "lightning" in rounds:
        count = 20
        difficulty = settings.lightning_difficulty or "medium-hard"
        prompt = (
            "Generate lightning round questions as JSON with this schema: "
            '{"questions":[{"text":"...", "answer":"...", "difficulty":"", "category":""}]}. '
            f"Generate {count} questions. difficulty must be '{difficulty}'."
        )
        data = await _call_llm(prompt)
        questions = [schemas.QuestionOut(id="tmp", **q) for q in data["questions"]]
        generated.lightning = _add_ids_to_questions(questions)

    if "guess-number" in rounds:
        count = settings.guess_number_questions or 10
        prompt = (
            "Generate estimation questions as JSON with this schema: "
            '{"questions":[{"question":"...", "answer":123}]}. '
            f"Generate {count} questions. Answers must be numbers."
        )
        data = await _call_llm(prompt)
        generated.guessNumber = [schemas.GuessNumberQuestion(**q) for q in data["questions"]]

    if "connect-4" in rounds:
        themes = settings.connect4_themes or ["general", "science", "history", "pop-culture"]
        base_prompt = (
            "Generate Connect 4 trivia questions as JSON with this schema: "
            '{"questions":[{"column":0,"row":0,'
            '"question":{"text":"...","answer":"...","difficulty":"easy","category":"..."}'
            "}]}. "
            "Generate 16 questions for 4 columns (0-3) and 4 rows (0-3). "
            "Difficulty by row: row0=easy,row1=medium,row2=medium-hard,row3=hard. "
            f"Column themes by index: {themes}. "
            "Do NOT ask about the game 'Connect 4' or its rules. "
            "All questions must be standard trivia within the provided themes."
        )

        positions = {(col, row) for col in range(4) for row in range(4)}
        connect4_map: dict[tuple[int, int], schemas.Connect4Question] = {}

        def add_items(items: list[dict]) -> None:
            for item in items:
                column = int(item["column"])
                row = int(item["row"])
                if (column, row) not in positions:
                    continue
                question_text = item["question"]["text"]
                answer = item["question"]["answer"]
                category = item["question"].get("category")
                if _is_connect4_question(question_text, answer, category):
                    continue
                connect4_map[(column, row)] = schemas.Connect4Question(
                    column=column,
                    row=row,
                    question=schemas.QuestionOut(
                        id=str(uuid.uuid4()),
                        text=question_text,
                        answer=answer,
                        difficulty=item["question"]["difficulty"],
                        category=category,
                    ),
                )

        data = await _call_llm(base_prompt)
        add_items(data.get("questions", []))

        retries = 0
        while len(connect4_map) < 16 and retries < 3:
            missing = sorted(list(positions - set(connect4_map.keys())))
            retry_prompt = (
                "Generate trivia questions as JSON with this schema: "
                '{"questions":[{"column":0,"row":0,'
                '"question":{"text":"...","answer":"...","difficulty":"easy","category":"..."}'
                "}]}. "
                f"Only generate questions for these positions: {missing}. "
                "Do NOT ask about the game 'Connect 4' or its rules. "
                f"Column themes by index: {themes}."
            )
            data = await _call_llm(retry_prompt)
            add_items(data.get("questions", []))
            retries += 1

        if len(connect4_map) < 16:
            raise ValueError("Unable to generate non-Connect-4 trivia for all positions")

        generated.connect4 = [connect4_map[(col, row)] for col in range(4) for row in range(4)]

    if "blind-draw" in rounds:
        count = 5
        difficulty = settings.blind_draw_difficulty or "medium-hard"
        prompt = (
            "Generate drawing prompt words as JSON with this schema: "
            '{"words":["word1","word2"]}. '
            f"Generate {count} words. difficulty='{difficulty}'."
        )
        data = await _call_llm(prompt)
        generated.blindDraw = list(data["words"])

    return generated


def get_llm_summary() -> tuple[str, str, str, str, bool, bool]:
    provider, api_key, base_url, model, config_path, using_env = _get_llm_config()
    key_present = bool(api_key)
    return provider, base_url, model, config_path, using_env, key_present


async def regenerate_question(payload: schemas.RegenerateQuestionRequest) -> schemas.RegenerateQuestionResponse:
    round_type = payload.round_type
    if round_type in ("trivia-buzz", "lightning"):
        difficulty = payload.difficulty or "medium-hard"
        prompt = (
            "Generate ONE trivia question as JSON with this schema: "
            '{"question":{"text":"...", "answer":"...", "difficulty":"", "category":""}}. '
            f"difficulty must be '{difficulty}'."
        )
        data = await _call_llm(prompt)
        question = schemas.QuestionOut(
            id=str(uuid.uuid4()),
            text=data["question"]["text"],
            answer=data["question"]["answer"],
            difficulty=data["question"]["difficulty"],
            category=data["question"].get("category"),
        )
        return schemas.RegenerateQuestionResponse(round_type=round_type, question=question)

    if round_type == "guess-number":
        prompt = (
            "Generate ONE estimation question as JSON with this schema: "
            '{"question":{"question":"...", "answer":123}}.'
        )
        data = await _call_llm(prompt)
        return schemas.RegenerateQuestionResponse(
            round_type=round_type,
            guess_number=schemas.GuessNumberQuestion(**data["question"]),
        )

    if round_type == "connect-4":
        difficulty = payload.difficulty or "medium-hard"
        category = payload.category or "general"
        prompt = (
            "Generate ONE trivia question as JSON with this schema: "
            '{"question":{"text":"...", "answer":"...", "difficulty":"", "category":""}}. '
            f"difficulty must be '{difficulty}'. category should be '{category}'. "
            "Do NOT ask about the game 'Connect 4' or its rules."
        )
        attempts = 0
        question = None
        while attempts < 3:
            data = await _call_llm(prompt)
            candidate = data["question"]
            if not _is_connect4_question(candidate["text"], candidate["answer"], candidate.get("category")):
                question = schemas.QuestionOut(
                    id=str(uuid.uuid4()),
                    text=candidate["text"],
                    answer=candidate["answer"],
                    difficulty=candidate["difficulty"],
                    category=candidate.get("category"),
                )
                break
            attempts += 1
        if not question:
            raise ValueError("LLM returned Connect-4-specific question")
        return schemas.RegenerateQuestionResponse(
            round_type=round_type,
            connect4=schemas.Connect4Question(
                column=payload.column or 0,
                row=payload.row or 0,
                question=question,
            ),
        )

    if round_type == "blind-draw":
        difficulty = payload.difficulty or "medium-hard"
        prompt = (
            "Generate ONE drawing word as JSON with this schema: "
            '{"word":"..."} '
            f"difficulty='{difficulty}'."
        )
        data = await _call_llm(prompt)
        return schemas.RegenerateQuestionResponse(round_type=round_type, word=data["word"])

    raise ValueError("Unsupported round type")
