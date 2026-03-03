from pydantic import BaseModel, Field
from enum import Enum


class SessionState(str, Enum):
    IDLE = "idle"
    AWAITING_CHOICE = "awaiting_choice"
    AWAITING_INPUT = "awaiting_input"
    EXECUTING = "executing"


class ChatSession(BaseModel):
    session_id: str
    state: SessionState = SessionState.IDLE
    active_scenario_id: str | None = None
    current_step_index: int = 0
    current_branch_key: str | None = None
    current_branch_step_index: int = 0
    collected_inputs: dict[str, str] = Field(default_factory=dict)

    def reset(self):
        self.state = SessionState.IDLE
        self.active_scenario_id = None
        self.current_step_index = 0
        self.current_branch_key = None
        self.current_branch_step_index = 0
        self.collected_inputs.clear()
