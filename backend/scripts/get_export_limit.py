import json


def main():
    # In a real system, this would query a database or API
    result = {
        "export_limit": 1000,
        "unit": "records",
        "last_modified": "2026-02-15"
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
