import json
import subprocess
import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--args', type=str, default='{}')
parsed = parser.parse_args()
params = json.loads(parsed.args)

uuid = params.get("uuid", "").strip()
ip = params.get("ip", "").strip()

result = {"success": False, "uuid": uuid, "ip": ip}

if not uuid or not ip:
    result["error"] = "Missing required parameters (uuid, ip)."
    print(json.dumps(result))
    sys.exit(0)

# Use "balena device ssh <UUID> energy-runtime" with command piped via stdin
# Note: per balena docs, piping commands to service containers via UUID
# may not work due to a backend limitation. If it fails, we fall back
# to host OS ssh and run the ping from there.
try:
    # Try service container first
    cmd = f"ping -c 3 -W 5 {ip}; exit;\n"
    proc = subprocess.run(
        ["balena", "device", "ssh", uuid, "energy-runtime"],
        input=cmd,
        capture_output=True, text=True, timeout=30
    )

    # If service container SSH failed, try host OS
    if proc.returncode != 0 and "not currently possible" in (proc.stderr or ""):
        proc = subprocess.run(
            ["balena", "device", "ssh", uuid],
            input=cmd,
            capture_output=True, text=True, timeout=30
        )

    output = proc.stdout.strip()
    stderr = proc.stderr.strip()

    if proc.returncode != 0 or "0 received" in output or "100% packet loss" in output:
        result["error"] = (
            f"Cannot reach battery at {ip} from device {uuid}.\n"
            "Please check:\n"
            "  1. Battery is powered on\n"
            "  2. Network cable is connected\n"
            "  3. IP address is correct"
        )
        result["ping_output"] = output or stderr
        print(json.dumps(result))
        sys.exit(0)

    result["success"] = True
    result["message"] = f"Battery is reachable at {ip} from device {uuid}"
    result["ping_output"] = output

except FileNotFoundError:
    result["error"] = "Balena CLI is not installed."
except subprocess.TimeoutExpired:
    result["error"] = f"Ping to {ip} timed out. The battery may be unreachable."
except Exception as e:
    result["error"] = str(e)

print(json.dumps(result))
