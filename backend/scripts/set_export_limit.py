import json
import sys
import argparse


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--args", type=str, required=True)
    parsed = parser.parse_args()

    args = json.loads(parsed.args)
    new_limit = args.get("new_limit")

    if not new_limit:
        print("Error: new_limit is required", file=sys.stderr)
        sys.exit(1)

    try:
        limit_val = int(new_limit)
    except ValueError:
        print("Error: new_limit must be a number", file=sys.stderr)
        sys.exit(1)

    # In a real system, this would update a database or API
    result = {
        "status": "success",
        "previous_limit": 1000,
        "new_export_limit": limit_val
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
