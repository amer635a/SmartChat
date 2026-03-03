from pydantic import BaseModel


class ResponseMessage(BaseModel):
    type: str  # text, script_result, question, input_request, error, scenario_end, typing, scenario_start
    content: str
    display_message: str | None = None
    options: list[dict[str, str]] | None = None
    input_key: str | None = None
