import json
import yaml

# Load training phrases
with open("/home/amer/Desktop/Projects/SmartChat/battery_connection_training.json") as f:
    phrases = json.load(f)

scenario = {
    "id": "check_battery_connection",
    "name": "Check Battery Connection Configuration",
    "description": "Troubleshoot why the battery connection cannot be configured on the site.",
    "training_phrases": phrases,
    "steps": [
        {
            "action": "ask_choice",
            "question": "Do you have permission to access Balena?",
            "options": [
                {"label": "Yes", "value": "yes"},
                {"label": "No", "value": "no"},
            ],
            "branches": {
                "yes": [
                    {"action": "goto", "target": "collect_info"},
                ],
                "no": [
                    {
                        "action": "end",
                        "message": "We can't help with this right now. Balena access is required to troubleshoot battery connection issues. Please obtain the necessary permissions and try again.",
                    },
                ],
            },
        },
        {
            "action": "ask_input",
            "label": "collect_info",
            "question": "What is the Balena UUID of the device?",
            "input_key": "balena_uuid",
        },
        {
            "action": "ask_input",
            "question": "What is the battery IP address?",
            "input_key": "battery_ip",
        },
        {
            "action": "ask_input",
            "question": "What is the battery port?",
            "input_key": "battery_port",
        },
        {
            "action": "run_script",
            "script": "check_battery_connection.py",
            "args": {
                "uuid": "$input.balena_uuid",
                "ip": "$input.battery_ip",
                "port": "$input.battery_port",
            },
            "display_message": "Checking battery connection...",
        },
        {
            "action": "ask_choice",
            "question": "Can you see the battery device on the monitoring UI?",
            "options": [
                {"label": "Yes, I can see it but it's not working", "value": "yes_visible"},
                {"label": "No, I cannot see it", "value": "no_visible"},
            ],
            "branches": {
                "yes_visible": [
                    {
                        "action": "end",
                        "message": "It looks like the connection already exists but the serial numbers of the devices may have been changed. Please take the connection details from above and consult with an engineer for further investigation.",
                    },
                ],
                "no_visible": [
                    {
                        "action": "end",
                        "message": "The device connection may not be properly configured. Please verify the IP address and port settings are correct, and consult with an engineer if the issue persists.",
                    },
                ],
            },
        },
    ],
}

output_path = "/home/amer/Desktop/Projects/SmartChat/backend/scenarios/check_battery_connection.yaml"
with open(output_path, "w") as f:
    yaml.dump(scenario, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

print(f"Scenario written to {output_path}")
print(f"Training phrases: {len(phrases)}")
print(f"Steps: {len(scenario['steps'])}")
