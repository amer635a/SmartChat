import subprocess
import json
import sys
from pathlib import Path


class ScriptExecutor:
    def __init__(self, scripts_dir: Path, timeout: int = 30):
        self.scripts_dir = scripts_dir.resolve()
        self.timeout = timeout

    async def run(self, script_name: str | None = None, command: str | None = None,
                  args: dict[str, str] | None = None) -> str:
        if command:
            return await self._run_command(command, args)
        if script_name:
            return await self._run_script(script_name, args)
        return "Error: No script or command specified."

    async def _run_script(self, script_name: str, args: dict[str, str] | None = None) -> str:
        script_path = (self.scripts_dir / script_name).resolve()

        # Security: ensure script is inside the scripts directory
        if not str(script_path).startswith(str(self.scripts_dir)):
            return "Error: Path traversal blocked."

        if not script_path.exists():
            return f"Error: Script not found: {script_name}"

        if script_path.suffix not in (".py", ".sh"):
            return "Error: Only .py and .sh scripts are allowed."

        if script_path.suffix == ".sh":
            cmd = ["bash", str(script_path)]
            if args:
                cmd.append(json.dumps(args))
        else:
            cmd = [sys.executable, str(script_path)]
            if args:
                cmd.extend(["--args", json.dumps(args)])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=str(self.scripts_dir),
            )
            if result.returncode != 0:
                return f"Error: {result.stderr.strip()}"
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            return "Error: Script execution timed out."
        except Exception as e:
            return f"Error: {str(e)}"

    async def _run_command(self, command: str, args: dict[str, str] | None = None) -> str:
        resolved = command
        if args:
            for key, value in args.items():
                resolved = resolved.replace(f"${{{key}}}", value)

        try:
            result = subprocess.run(
                resolved,
                shell=True,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=str(self.scripts_dir),
            )
            if result.returncode != 0:
                return f"Error: {result.stderr.strip()}"
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            return "Error: Command execution timed out."
        except Exception as e:
            return f"Error: {str(e)}"
