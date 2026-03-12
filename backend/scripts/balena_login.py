import json
import subprocess
import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--args', type=str, default='{}')
parsed = parser.parse_args()
params = json.loads(parsed.args)

token = params.get("token", "").strip()

result = {"success": False}

if not token:
    result["error"] = "No authentication token provided."
    print(json.dumps(result))
    sys.exit(0)

try:
    # Login to Balena using the auth token
    proc = subprocess.run(
        ["balena", "login", "--token", token],
        capture_output=True, text=True, timeout=20
    )
    if proc.returncode != 0:
        result["error"] = f"Balena login failed: {proc.stderr.strip() or proc.stdout.strip()}"
        print(json.dumps(result))
        sys.exit(0)

    # Verify login with whoami
    whoami = subprocess.run(
        ["balena", "whoami"],
        capture_output=True, text=True, timeout=10
    )
    if whoami.returncode == 0 and whoami.stdout.strip():
        lines = whoami.stdout.strip().split("\n")
        username = lines[-1].strip() if lines else "unknown"
        result["success"] = True
        result["username"] = username
        result["message"] = f"Successfully logged in as: {username}"
    else:
        result["error"] = "Login command succeeded but could not verify authentication."

except FileNotFoundError:
    result["error"] = "Balena CLI is not installed. Please install it first."
except subprocess.TimeoutExpired:
    result["error"] = "Balena login timed out."
except Exception as e:
    result["error"] = str(e)

print(json.dumps(result))
