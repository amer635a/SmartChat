import yaml
from pathlib import Path
from app.models.scenario import Scenario


def load_scenario(file_path: Path) -> Scenario:
    with open(file_path) as f:
        raw = yaml.safe_load(f)
    return Scenario(**raw)


def load_all_scenarios(scenarios_dir: Path) -> list[Scenario]:
    scenarios = []
    for yaml_file in sorted(scenarios_dir.glob("*.yaml")):
        if yaml_file.name.startswith("_"):
            continue
        scenarios.append(load_scenario(yaml_file))
    return scenarios
