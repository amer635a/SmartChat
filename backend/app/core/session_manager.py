from app.models.session import ChatSession


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, ChatSession] = {}

    def create_session(self, session_id: str) -> ChatSession:
        session = ChatSession(session_id=session_id)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> ChatSession | None:
        return self._sessions.get(session_id)

    def get_or_create(self, session_id: str) -> ChatSession:
        session = self.get_session(session_id)
        if session is None:
            session = self.create_session(session_id)
        return session

    def remove_session(self, session_id: str):
        self._sessions.pop(session_id, None)

    def close_all(self):
        self._sessions.clear()
