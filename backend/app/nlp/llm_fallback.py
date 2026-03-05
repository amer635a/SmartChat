import os
from anthropic import Anthropic


class LLMFallback:
    def __init__(self, scenario_names: list[str] | None = None):
        self.scenario_names = scenario_names or []

    def update_scenarios(self, scenario_names: list[str]):
        self.scenario_names = scenario_names

    async def generate_response(self, user_text: str) -> str | None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return None

        client = Anthropic(api_key=api_key)

        scenarios_info = ""
        if self.scenario_names:
            scenarios_info = (
                "\n\nThe chatbot supports these specific topics (scenarios): "
                + ", ".join(self.scenario_names)
                + ". If the user's question is close to one of these, suggest they rephrase."
            )

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=(
                "You are a helpful assistant in a support chatbot called SmartChat. "
                "The user asked something that didn't match any predefined scenario. "
                "Provide a brief, helpful response. If you don't know the specific answer, "
                "be honest and suggest how the user might find the information."
                f"{scenarios_info}"
            ),
            messages=[{"role": "user", "content": user_text}],
        )

        return response.content[0].text
