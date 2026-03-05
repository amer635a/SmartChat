from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal


class ChoiceOption(BaseModel):
    label: str
    value: str


class Step(BaseModel):
    action: Literal["run_script", "ask_choice", "ask_input", "end", "goto"]

    # Optional label — used as a goto target
    label: str | None = None

    # For run_script
    script: str | None = None
    args: dict[str, str] | None = None
    display_message: str | None = None

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
