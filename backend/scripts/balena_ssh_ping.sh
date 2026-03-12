#!/bin/bash
# SSH into balena device and ping battery IP from energy-runtime container
# Args (JSON): uuid, ip

ARGS="$1"
ARGS="${ARGS:-"{}"}"
eval "$(ARGS_JSON="$ARGS" python3 -c "
import os, json
args = json.loads(os.environ['ARGS_JSON'])
print(f'UUID={json.dumps(args.get(\"uuid\",\"\").strip())}')
print(f'IP={json.dumps(args.get(\"ip\",\"\").strip())}')
")"

RESULT_BASE="{\"uuid\": \"$UUID\", \"ip\": \"$IP\""

if [ -z "$UUID" ] || [ -z "$IP" ]; then
  echo "${RESULT_BASE}, \"success\": false, \"error\": \"Missing required parameters (uuid, ip).\"}"
  exit 0
fi

# SSH to host OS, find energy-runtime container, exec ping inside it
REMOTE_CMD="CONTAINER=\$(balena-engine ps --format '{{.Names}}' | grep '^energy-runtime'); balena-engine exec \$CONTAINER ping -c 3 -W 5 $IP; exit;"

OUTPUT=$(echo "$REMOTE_CMD" | balena device ssh "$UUID" 2>/tmp/balena_ssh_err)
RC=$?
STDERR=$(cat /tmp/balena_ssh_err 2>/dev/null)

if [ $RC -ne 0 ] || echo "$OUTPUT" | grep -q "0 received" || echo "$OUTPUT" | grep -q "100% packet loss"; then
  SAFE_OUTPUT=$(echo "$OUTPUT$STDERR" | head -5 | tr '"' "'" | tr '\n' ' ')
  echo "${RESULT_BASE}, \"success\": false, \"error\": \"Cannot reach battery at $IP from device $UUID. Please check: 1. Battery is powered on, 2. Network cable is connected, 3. IP address is correct\", \"ping_output\": \"$SAFE_OUTPUT\"}"
  exit 0
fi

SAFE_OUTPUT=$(echo "$OUTPUT" | tail -5 | tr '"' "'" | tr '\n' ' ')
echo "${RESULT_BASE}, \"success\": true, \"message\": \"Battery is reachable at $IP from device $UUID\", \"ping_output\": \"$SAFE_OUTPUT\"}"
