import json
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, game_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(game_id, set()).add(websocket)

    def disconnect(self, game_id: str, websocket: WebSocket) -> None:
        if game_id in self._connections:
            self._connections[game_id].discard(websocket)
            if not self._connections[game_id]:
                del self._connections[game_id]

    async def broadcast(self, game_id: str, payload: dict[str, Any]) -> None:
        if game_id not in self._connections:
            return
        message = json.dumps(payload)
        stale: list[WebSocket] = []
        for websocket in self._connections[game_id]:
            try:
                await websocket.send_text(message)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(game_id, websocket)


manager = ConnectionManager()
