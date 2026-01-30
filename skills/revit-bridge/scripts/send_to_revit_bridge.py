"""Helper for OpenCode: send Python to the DTCAI add-in's local HTTP bridge."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

DEFAULT_PORT = 51337
TOKEN_SUBPATH = Path("DTCAI") / "token.txt"


def _load_token() -> str:
    env_token = os.environ.get("DTC_AI_TOKEN")
    if env_token and env_token.strip():
        return env_token.strip()

    appdata = os.environ.get("APPDATA")
    if not appdata:
        raise RuntimeError("APPDATA is not set, cannot locate DTCAI token file.")

    token_path = Path(appdata) / TOKEN_SUBPATH
    if not token_path.exists():
        raise FileNotFoundError(f"Token file not found at {token_path}. Launch Revit to generate it.")

    token = token_path.read_text(encoding="utf-8").strip()
    if not token:
        raise ValueError(f"Token file at {token_path} is empty.")

    return token


def send_to_revit_bridge(
    code: str,
    *,
    port: Optional[int] = None,
    timeout_ms: Optional[int] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Send Python code to the DTCAI local bridge and return the parsed JSON response."""

    token = _load_token()
    port = port or int(os.environ.get("DTC_AI_PORT") or DEFAULT_PORT)
    url = f"http://127.0.0.1:{port}/execute"

    payload: Dict[str, Any] = {"code": code}
    if timeout_ms is not None and timeout_ms > 0:
        payload["timeoutMs"] = timeout_ms
    if context:
        payload["context"] = context

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Content-Length": str(len(data)),
        "x-dtc-token": token,
    }

    request = urllib.request.Request(url, data=data, headers=headers, method="POST")
    timeout_seconds = (timeout_ms or 0) / 1000 if timeout_ms else None

    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            body = response.read()
            return json.loads(body.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Bridge request failed ({exc.code}): {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Bridge request failed: {exc.reason}") from exc


def _read_code_from_args(args: argparse.Namespace) -> str:
    if args.file:
        return Path(args.file).read_text(encoding="utf-8")
    if args.code:
        return args.code
    if not sys.stdin.isatty():
        return sys.stdin.read()
    raise ValueError("No code provided. Use --code, --file, or pipe the script via stdin.")


def _parse_context(value: Optional[str]) -> Optional[Dict[str, Any]]:
    if not value:
        return None
    return json.loads(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Send Python code to the DTCAI local Revit bridge.")
    parser.add_argument("--code", type=str, help="Inline Python to execute.")
    parser.add_argument("--file", type=Path, help="Path to a Python script.")
    parser.add_argument("--port", type=int, help="Override the bridge port (default 51337 or DTC_AI_PORT).")
    parser.add_argument("--timeout-ms", type=int, help="Request timeout in milliseconds.")
    parser.add_argument(
        "--context",
        type=str,
        help="JSON string to send as `context` (available to the Python scope).",
    )
    args = parser.parse_args()

    code = _read_code_from_args(args)
    context = _parse_context(args.context)
    port = args.port
    timeout_ms = args.timeout_ms

    response = send_to_revit_bridge(code, port=port, timeout_ms=timeout_ms, context=context)
    print(json.dumps(response, indent=2))

    success = response.get("success") is True or response.get("Success") is True
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(2)
