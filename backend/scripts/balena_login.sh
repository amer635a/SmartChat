#!/bin/bash
# Balena login using authentication token
# Args (JSON): token

ARGS="$1"
ARGS="${ARGS:-"{}"}"
TOKEN=$(ARGS_JSON="$ARGS" python3 -c "import os,json; print(json.loads(os.environ['ARGS_JSON']).get('token','').strip())")

if [ -z "$TOKEN" ]; then
  echo '{"success": false, "error": "No authentication token provided."}'
  exit 0
fi

# Login to Balena
LOGIN_OUTPUT=$(balena login --token "$TOKEN" 2>&1)
LOGIN_RC=$?

if [ $LOGIN_RC -ne 0 ]; then
  ERROR=$(echo "$LOGIN_OUTPUT" | tr '"' "'" | tr '\n' ' ')
  echo "{\"success\": false, \"error\": \"Balena login failed: $ERROR\"}"
  exit 0
fi

# Verify with whoami
WHOAMI_OUTPUT=$(balena whoami 2>&1)
WHOAMI_RC=$?

if [ $WHOAMI_RC -eq 0 ] && [ -n "$WHOAMI_OUTPUT" ]; then
  USERNAME=$(echo "$WHOAMI_OUTPUT" | tail -1 | xargs)
  echo "{\"success\": true, \"username\": \"$USERNAME\", \"message\": \"Successfully logged in as: $USERNAME\"}"
else
  echo '{"success": false, "error": "Login command succeeded but could not verify authentication."}'
fi
