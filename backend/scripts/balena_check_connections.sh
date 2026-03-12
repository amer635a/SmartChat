#!/bin/bash
# SSH into balena device and check device driver connections via energy-runtime container
# Args (JSON): uuid, ip, port

ARGS="$1"
ARGS="${ARGS:-"{}"}"
eval "$(ARGS_JSON="$ARGS" python3 -c "
import os, json
args = json.loads(os.environ['ARGS_JSON'])
print(f'UUID={json.dumps(args.get(\"uuid\",\"\").strip())}')
print(f'IP={json.dumps(args.get(\"ip\",\"\").strip())}')
print(f'PORT={json.dumps(args.get(\"port\",\"\").strip())}')
")"

if [ -z "$UUID" ]; then
  echo "{\"success\": false, \"connection_found\": false, \"error\": \"Missing Balena UUID.\"}"
  exit 0
fi

# SSH to host OS, find energy-runtime container, exec curl inside it
REMOTE_CMD="CONTAINER=\$(balena-engine ps --format '{{.Names}}' | grep '^energy-runtime'); balena-engine exec \$CONTAINER curl -s -X POST http://localhost:8087/api/commands/list-device-driver-connections -H 'Content-Type: application/json' -d '{}'; exit;"

OUTPUT=$(echo "$REMOTE_CMD" | balena device ssh "$UUID" 2>/tmp/balena_ssh_err)
RC=$?
STDERR=$(cat /tmp/balena_ssh_err 2>/dev/null)

if [ $RC -ne 0 ] || [ -z "$OUTPUT" ]; then
  SAFE_ERR=$(echo "$STDERR" | head -3 | tr '"' "'" | tr '\n' ' ')
  echo "{\"success\": false, \"connection_found\": false, \"error\": \"Could not retrieve device driver connections.\", \"detail\": \"$SAFE_ERR\"}"
  exit 0
fi

# Parse JSON response and check for matching connection
export OUTPUT IP PORT UUID
python3 << 'PYEOF'
import json, sys, os

output = os.environ["OUTPUT"]
ip = os.environ["IP"]
port = os.environ["PORT"]
uuid = os.environ["UUID"]

result = {
    "success": False,
    "uuid": uuid,
    "ip": ip,
    "port": port,
    "connection_found": False,
    "connections": [],
}

try:
    json_start = output.find("{")
    json_end = output.rfind("}")
    if json_start == -1 or json_end == -1:
        result["error"] = "No JSON found in response."
        print(json.dumps(result))
        sys.exit(0)

    data = json.loads(output[json_start:json_end + 1])
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
            if str(config.get("ip", "")) == ip and str(config.get("port", "")) == port:
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
except Exception as e:
    result["error"] = str(e)

print(json.dumps(result, indent=2))
PYEOF
