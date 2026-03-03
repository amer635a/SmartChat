import json
import argparse


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--args", type=str, required=True)
    parsed = parser.parse_args()

    args = json.loads(parsed.args)
    email = args.get("email", "unknown@example.com")

    # In a real system, this would trigger a password reset
    result = {
        "status": "success",
        "email": email,
        "message": "Temporary password sent to user's email"
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
