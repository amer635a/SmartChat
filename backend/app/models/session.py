from pydantic import BaseModel, Field
from enum import Enum


class SessionState(str, Enum):
    IDLE = "idle"
    AWAITING_CHOICE = "awaiting_choice"
    AWAITING_INPUT = "awaiting_input"
    EXECUTING = "executing"


class BranchFrame(BaseModel):
    """One level of branch nesting: which branch key and position within it."""
    branch_key: str
    step_index: int = 0


class CallFrame(BaseModel):
    """Saved position in a scenario so we can return after call_scenario."""
    scenario_id: str
    step_index: int
    branch_path: list[BranchFrame] = Field(default_factory=list)


class ChatSession(BaseModel):
    session_id: str
    state: SessionState = SessionState.IDLE
    active_scenario_id: str | None = None
    current_step_index: int = 0
    branch_path: list[BranchFrame] = Field(default_factory=list)
    collected_inputs: dict[str, str] = Field(default_factory=dict)
    call_stack: list[CallFrame] = Field(default_factory=list)

    def reset(self):
        self.state = SessionState.IDLE
        self.active_scenario_id = None
        self.current_step_index = 0
        self.branch_path.clear()
        self.collected_inputs.clear()
        self.call_stack.clear()
