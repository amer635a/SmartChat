import json
import argparse
import subprocess
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--args', type=str, default='{}')
parsed = parser.parse_args()
params = json.loads(parsed.args)

uuid = params.get("uuid", "").strip()
ip = params.get("ip", "").strip()
port = params.get("port", "").strip()

if not uuid or not ip or not port:
    print(json.dumps({"error": "Missing required parameters (uuid, ip, port)"}))
    sys.exit(1)

results = {
    "uuid": uuid,
    "ip": ip,
    "port": port,
    "steps": [],
    "connection_found": False,
    "connections": [],
}


def run_cmd(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)


def balena_ssh_cmd(uuid, service, command, timeout=30):
    """Run a command inside a balena device container via host OS + balena-engine exec."""
    try:
        remote_cmd = (
            f"CONTAINER=$(balena-engine ps --format '{{{{.Names}}}}' | grep '^{service}'); "
            f"balena-engine exec $CONTAINER {command}; exit;\n"
        )
        proc = subprocess.run(
            ["balena", "device", "ssh", uuid],
            input=remote_cmd,
            capture_output=True, text=True, timeout=timeout
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)


# Step 1: Balena authentication check
code, out, err = run_cmd("balena whoami")
if code != 0:
    results["steps"].append({
        "step": "Balena Authentication",
        "status": "FAILED",
        "message": "Not authenticated with Balena. Please run 'balena login' first.",
        "detail": err,
    })
    print(json.dumps(results))
    sys.exit(0)

username = out.split("\n")[-1].strip() if out else "unknown"
results["steps"].append({
    "step": "Balena Authentication",
    "status": "OK",
    "message": f"Authenticated as: {username}",
})

# Step 2: SSH connectivity test
code, out, err = balena_ssh_cmd(uuid, "energy-runtime", "echo CONNECTION_OK", timeout=20)
if code != 0 or "CONNECTION_OK" not in out:
    results["steps"].append({
        "step": "SSH to energy-runtime",
        "status": "FAILED",
        "message": f"Could not SSH into energy-runtime on device {uuid}.",
        "detail": err or out,
    })
    print(json.dumps(results))
    sys.exit(0)

results["steps"].append({
    "step": "SSH to energy-runtime",
    "status": "OK",
    "message": f"Connected to energy-runtime on {uuid}",
})

# Step 3: Ping the battery
code, out, err = balena_ssh_cmd(uuid, "energy-runtime", f"ping -c 3 -W 5 {ip}", timeout=25)
if code != 0 or "0 received" in out or "100% packet loss" in out:
    results["steps"].append({
        "step": "Ping Battery",
        "status": "FAILED",
        "message": f"Cannot reach battery at {ip}.",
        "detail": "The battery is not reachable. Please check: "
                  "(1) Battery is powered on, "
                  "(2) Network cable is connected, "
                  "(3) IP address is correct.",
    })
    print(json.dumps(results))
    sys.exit(0)

results["steps"].append({
    "step": "Ping Battery",
    "status": "OK",
    "message": f"Battery is reachable at {ip}",
})

# Step 4: List device driver connections
curl_cmd = (
    "curl -s -X POST http://localhost:8087/api/commands/list-device-driver-connections "
    "-H 'Content-Type: application/json' -d '{}'"
)
code, out, err = balena_ssh_cmd(uuid, "energy-runtime", curl_cmd, timeout=20)
if code != 0 or not out:
    results["steps"].append({
        "step": "List Connections",
        "status": "FAILED",
        "message": "Could not retrieve device driver connections.",
        "detail": err or "Empty response from API",
    })
    print(json.dumps(results))
    sys.exit(0)

# Step 5: Parse and check if connection exists
try:
    # Find JSON in output (may contain shell prompt lines)
    json_start = out.find('{')
    json_end = out.rfind('}')
    if json_start == -1 or json_end == -1:
        raise json.JSONDecodeError("No JSON found", out, 0)
    json_str = out[json_start:json_end + 1]
    data = json.loads(json_str)
    connections = data.get("deviceDriverConnections", [])
except (json.JSONDecodeError, KeyError):
    results["steps"].append({
        "step": "List Connections",
        "status": "FAILED",
        "message": "Invalid response from device driver API.",
        "detail": out[:500],
    })
    print(json.dumps(results))
    sys.exit(0)

results["steps"].append({
    "step": "List Connections",
    "status": "OK",
    "message": f"Found {len(connections)} device driver connection(s)",
})

# Check if any connection matches the given IP and port
found = False
for conn in connections:
    for step in conn.get("configuredSteps", []):
        config = step.get("config", {})
        conn_ip = str(config.get("ip", ""))
        conn_port = str(config.get("port", ""))
        if conn_ip == ip and conn_port == port:
            found = True
            results["connection_found"] = True
            results["matching_connection"] = {
                "connectionId": conn.get("connectionId", ""),
                "driverUri": conn.get("driverUri", ""),
                "deviceSerials": conn.get("deviceSerials", []),
                "config": config,
            }
            break
    if found:
        break

if found:
    mc = results["matching_connection"]
    results["steps"].append({
        "step": "Connection Check",
        "status": "FOUND",
        "message": (
            f"Connection EXISTS for {ip}:{port}\n"
            f"  Driver: {mc['driverUri']}\n"
            f"  Connection ID: {mc['connectionId']}\n"
            f"  Devices: {len(mc['deviceSerials'])} device(s) linked"
        ),
    })
else:
    results["steps"].append({
        "step": "Connection Check",
        "status": "NOT_FOUND",
        "message": f"No connection found matching {ip}:{port}. The battery connection does not exist yet.",
    })

print(json.dumps(results, indent=2))
