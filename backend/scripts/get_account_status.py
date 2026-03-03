import json
import argparse


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--args", type=str, required=True)
    parsed = parser.parse_args()

    args = json.loads(parsed.args)
    email = args.get("email", "unknown@example.com")

    # In a real system, this would query a user database
    result = {
        "email": email,
        "status": "active",
        "role": "editor",
        "last_login": "2026-03-01T10:30:00Z",
        "locked": False
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
