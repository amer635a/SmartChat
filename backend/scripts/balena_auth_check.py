import json
import subprocess
import sys

results = {"authenticated": False, "username": ""}

try:
    r = subprocess.run(
        ["balena", "whoami"],
        capture_output=True, text=True, timeout=15
    )
    if r.returncode == 0 and r.stdout.strip():
        lines = r.stdout.strip().split("\n")
        username = lines[-1].strip() if lines else "unknown"
        results["authenticated"] = True
        results["username"] = username
    else:
        results["error"] = "Not logged in to Balena. Please run 'balena login' in your terminal first."
except FileNotFoundError:
    results["error"] = "Balena CLI is not installed. Please install it first."
except subprocess.TimeoutExpired:
    results["error"] = "Balena authentication check timed out."
except Exception as e:
    results["error"] = str(e)

print(json.dumps(results))
