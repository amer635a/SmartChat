from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal


class ChoiceOption(BaseModel):
    label: str
    value: str


class Step(BaseModel):
    action: Literal["run_script", "run_script_branch", "ask_choice", "ask_input", "end", "goto", "call_scenario"]

    # Optional label — used as a goto target
    label: str | None = None

    # For run_script — either a Python script name or a shell command
    script: str | None = None
    command: str | None = None
    args: dict[str, str] | None = None
    display_message: str | None = None

    # For run_script_branch — JSON field to check for branching (e.g. "success")
    # Branches on truthy → "success" key, falsy → "fail" key
    branch_field: str | None = None

    # For ask_choice / ask_input
    question: str | None = None
    options: list[ChoiceOption] | None = None
    branches: dict[str, list[Step]] | None = None

    # For ask_input
    input_key: str | None = None
    validation: str | None = None

    # For end
    message: str | None = None

    # For goto — jump to a labeled step in the main steps list
    target: str | None = None

    # For call_scenario — transition to another scenario
    target_scenario: str | None = None


class Scenario(BaseModel):
    id: str
    name: str
    description: str
    training_phrases: list[str] = Field(min_length=1)
    steps: list[Step] = Field(min_length=1)


class ScenarioSummary(BaseModel):
    id: str
    name: str
    description: str
