import yaml
from fastapi import APIRouter, HTTPException

from app.config import SCENARIOS_DIR, SCRIPTS_DIR
from app.models.scenario import Scenario

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("")
async def list_scenarios():
    from app.main import scenario_registry
    return scenario_registry.get_summaries()


@router.get("/scripts")
async def list_scripts():
    scripts = []
    for script_file in sorted(SCRIPTS_DIR.glob("*.py")):
        scripts.append({"name": script_file.name})
    return scripts


@router.get("/browse")
async def browse_files(path: str = "/"):
    """Browse the filesystem to pick a file for shell commands."""
    from pathlib import Path as P
    target = P(path).resolve()

    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    if target.is_file():
        return {"type": "file", "path": str(target)}

    items = []
    if str(target) != "/":
        items.append({"name": "..", "path": str(target.parent), "is_dir": True})

    try:
        for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.name.startswith("."):
                continue
            items.append({
                "name": entry.name,
                "path": str(entry),
                "is_dir": entry.is_dir(),
            })
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")

    return {"type": "directory", "path": str(target), "items": items}


@router.post("/create")
async def create_scenario(scenario: Scenario):
    from app.main import scenario_registry

    if "/" in scenario.id or "\\" in scenario.id or ".." in scenario.id:
        raise HTTPException(status_code=400, detail="Invalid scenario ID")

    file_path = SCENARIOS_DIR / f"{scenario.id}.yaml"
    data = scenario.model_dump(exclude_none=True)

    with open(file_path, "w") as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    scenario_registry.load_all()
    return {"status": "created", "id": scenario.id}


@router.delete("/{scenario_id}")
async def delete_scenario(scenario_id: str):
    from app.main import scenario_registry

    if "/" in scenario_id or "\\" in scenario_id or ".." in scenario_id:
        raise HTTPException(status_code=400, detail="Invalid scenario ID")

    file_path = SCENARIOS_DIR / f"{scenario_id}.yaml"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Scenario not found")

    file_path.unlink()
    scenario_registry.load_all()
    return {"status": "deleted", "id": scenario_id}


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    from app.main import scenario_registry
    scenario = scenario_registry.get(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.post("/reload")
async def reload_scenarios():
    from app.main import scenario_registry
    count = scenario_registry.load_all()
    return {"loaded": count}
