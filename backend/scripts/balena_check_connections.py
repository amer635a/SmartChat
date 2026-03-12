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
port = params.get("port", "").strip()

result = {
    "success": False,
    "uuid": uuid,
    "ip": ip,
    "port": port,
    "connection_found": False,
    "connections": [],
}

if not uuid:
    result["error"] = "Missing Balena UUID."
    print(json.dumps(result))
    sys.exit(0)

curl_cmd = (
    "curl -s -X POST http://localhost:8087/api/commands/list-device-driver-connections "
    "-H 'Content-Type: application/json' -d '{}'; exit;\n"
)

try:
    # Try service container first
    proc = subprocess.run(
        ["balena", "device", "ssh", uuid, "energy-runtime"],
        input=curl_cmd,
        capture_output=True, text=True, timeout=25
    )

    # Fallback to host OS if service container piping not supported
    if proc.returncode != 0 and "not currently possible" in (proc.stderr or ""):
        proc = subprocess.run(
            ["balena", "device", "ssh", uuid],
            input=curl_cmd,
            capture_output=True, text=True, timeout=25
        )

    output = proc.stdout.strip()

    if proc.returncode != 0 or not output:
        result["error"] = "Could not retrieve device driver connections."
        result["detail"] = proc.stderr.strip() or "Empty response from API"
        print(json.dumps(result))
        sys.exit(0)

    # Find JSON in output (may contain shell prompt lines)
    json_start = output.find('{')
    json_end = output.rfind('}')
    if json_start == -1 or json_end == -1:
        result["error"] = "No JSON found in response."
        result["detail"] = output[:500]
        print(json.dumps(result))
        sys.exit(0)

    json_str = output[json_start:json_end + 1]
    data = json.loads(json_str)
    connections = data.get("deviceDriverConnections", [])

    result["success"] = True
    result["total_connections"] = len(connections)

    for conn in connections:
        conn_info = {
            "connectionId": conn.get("connectionId", ""),
            "driverUri": conn.get("driverUri", ""),
            "deviceSerials": conn.get("deviceSerials", []),
        }
        result["connections"].append(conn_info)

        for step in conn.get("configuredSteps", []):
            config = step.get("config", {})
            conn_ip = str(config.get("ip", ""))
            conn_port = str(config.get("port", ""))
            if conn_ip == ip and conn_port == port:
                result["connection_found"] = True
                result["matching_connection"] = {
                    "connectionId": conn.get("connectionId", ""),
                    "driverUri": conn.get("driverUri", ""),
                    "deviceSerials": conn.get("deviceSerials", []),
                    "config": config,
                }

    if result["connection_found"]:
        mc = result["matching_connection"]
        serials = mc.get("deviceSerials", [])
        result["message"] = (
            f"Connection FOUND for {ip}:{port}\n"
            f"  Driver: {mc['driverUri']}\n"
            f"  Connection ID: {mc['connectionId']}\n"
            f"  Serial numbers: {', '.join(serials) if serials else 'none'}"
        )
    else:
        result["message"] = (
            f"No connection found matching {ip}:{port}.\n"
            f"Total connections on device: {len(connections)}"
        )

except json.JSONDecodeError:
    result["error"] = "Invalid JSON response from device driver API."
    result["detail"] = output[:500] if output else ""
except FileNotFoundError:
    result["error"] = "Balena CLI is not installed."
except subprocess.TimeoutExpired:
    result["error"] = "Connection check timed out."
except Exception as e:
    result["error"] = str(e)

print(json.dumps(result, indent=2))
