import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--args', type=str, default='{}')
parsed = parser.parse_args()
params = json.loads(parsed.args)

result = {
    "balena_uuid": params.get("uuid", ""),
    "battery_ip": params.get("ip", ""),
    "battery_port": params.get("port", ""),
}

print(json.dumps(result))
