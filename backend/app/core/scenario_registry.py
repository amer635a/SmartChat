from pathlib import Path
from app.models.scenario import Scenario, ScenarioSummary
from app.core.scenario_loader import load_all_scenarios


class ScenarioRegistry:
    def __init__(self, scenarios_dir: Path):
        self._scenarios: dict[str, Scenario] = {}
        self._scenarios_dir = scenarios_dir

    def load_all(self) -> int:
        self._scenarios.clear()
        for scenario in load_all_scenarios(self._scenarios_dir):
            self._scenarios[scenario.id] = scenario
        return len(self._scenarios)

    def get(self, scenario_id: str) -> Scenario | None:
        return self._scenarios.get(scenario_id)

    def get_all(self) -> list[Scenario]:
        return list(self._scenarios.values())

    def get_summaries(self) -> list[ScenarioSummary]:
        return [
            ScenarioSummary(id=s.id, name=s.name, description=s.description)
            for s in self._scenarios.values()
        ]

    def get_training_data(self) -> list[tuple[str, str]]:
        pairs = []
        for s in self._scenarios.values():
            for phrase in s.training_phrases:
                pairs.append((phrase, s.id))
        return pairs
