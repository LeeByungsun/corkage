#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_CASES = [
    {"query": "강남 와인바", "display": 5, "start": 1, "sort": "random"},
    {"query": "강남 와인바", "display": 10, "start": 1, "sort": "random"},
    {"query": "강남 와인바", "display": 5, "start": 2, "sort": "random"},
    {"query": "콜키지 와인바", "display": 5, "start": 1, "sort": "comment"},
]


def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        os.environ.setdefault(key, value)


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"missing required environment variable: {name}")
    return value


def strip_html(value: str) -> str:
    return re.sub(r"<[^>]+>", "", value)


def classify_link(value: str) -> str:
    if not value:
        return "empty"
    if "naver.com" in value:
        return "naver"
    return "external"


def run_case(case: dict[str, object], client_id: str, client_secret: str) -> dict[str, object]:
    query_string = urllib.parse.urlencode(case)
    url = f"https://openapi.naver.com/v1/search/local.json?{query_string}"
    request = urllib.request.Request(
        url,
        headers={
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret,
            "Accept": "*/*",
            "User-Agent": "corkage-verifier/1.0",
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))

    items = payload.get("items", [])

    return {
        "request": case,
        "response_meta": {
            "total": payload.get("total"),
            "start": payload.get("start"),
            "display": payload.get("display"),
            "lastBuildDate": payload.get("lastBuildDate"),
        },
        "item_count": len(items),
        "telephone_values": sorted({item.get("telephone", "") for item in items}),
        "link_types": sorted({classify_link(item.get("link", "")) for item in items}),
        "title_samples": [strip_html(item.get("title", "")) for item in items[:3]],
        "link_samples": [item.get("link", "") for item in items[:3]],
    }


def main() -> int:
    load_dotenv(Path(".env.local"))

    client_id = require_env("NAVER_CLIENT_ID")
    client_secret = require_env("NAVER_CLIENT_SECRET")

    results = [run_case(case, client_id, client_secret) for case in DEFAULT_CASES]

    output = {
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "endpoint": "https://openapi.naver.com/v1/search/local.json",
        "cases": results,
    }

    json.dump(output, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
