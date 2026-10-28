#!/usr/bin/env python3
"""Watches Bugcrowd and YesWeHack program scopes for changes and alerts via Telegram.

Data source: bounty-targets-data (community-maintained daily mirror of public
program scopes from Bugcrowd, YesWeHack, HackerOne, Intigriti).
https://github.com/arkadiyt/bounty-targets-data
"""
import json
import os
import sys
import urllib.request

SOURCES = {
    "bugcrowd": "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/main/data/bugcrowd_data.json",
    "yeswehack": "https://raw.githubusercontent.com/arkadiyt/bounty-targets-data/main/data/yeswehack_data.json",
}

SNAPSHOT_PATH = os.path.join(os.path.dirname(__file__), "data", "snapshot.json")


def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.load(resp)


def normalize(platform, raw):
    """Map each platform's program list to {program_name: set(in-scope targets)}."""
    result = {}
    if platform == "bugcrowd":
        for program in raw:
            name = program.get("name") or program.get("program_url", "unknown")
            targets = {
                t.get("target")
                for t in program.get("targets", {}).get("in_scope", [])
                if t.get("target")
            }
            result[name] = targets
    elif platform == "yeswehack":
        for program in raw:
            name = program.get("name") or program.get("slug", "unknown")
            targets = {
                t.get("target")
                for t in program.get("targets", {}).get("in_scope", [])
                if t.get("target")
            }
            result[name] = targets
    return result


def load_snapshot():
    if os.path.exists(SNAPSHOT_PATH):
        with open(SNAPSHOT_PATH) as f:
            return json.load(f)
    return {}


def save_snapshot(snapshot):
    os.makedirs(os.path.dirname(SNAPSHOT_PATH), exist_ok=True)
    with open(SNAPSHOT_PATH, "w") as f:
        json.dump(snapshot, f, indent=2, sort_keys=True)


def diff(old, new):
    """Return human-readable change lines: new programs, new/removed targets."""
    lines = []
    old_programs = old.get("programs", {})
    new_programs = new.get("programs", {})

    for name, targets in new_programs.items():
        if name not in old_programs:
            lines.append(f"[NEW PROGRAM] {name} ({len(targets)} targets)")
            continue
        old_targets = set(old_programs[name])
        new_targets = set(targets)
        added = new_targets - old_targets
        removed = old_targets - new_targets
        for t in sorted(added):
            lines.append(f"[+SCOPE] {name}: {t}")
        for t in sorted(removed):
            lines.append(f"[-SCOPE] {name}: {t}")

    for name in old_programs:
        if name not in new_programs:
            lines.append(f"[REMOVED PROGRAM] {name}")

    return lines


def send_telegram(message):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set, skipping notification")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    # Telegram caps message length at 4096 chars
    for i in range(0, len(message), 4000):
        chunk = message[i : i + 4000]
        data = json.dumps({"chat_id": chat_id, "text": chunk}).encode()
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=30)


def main():
    old_snapshot = load_snapshot()
    new_snapshot = {"programs": {}}

    for platform, url in SOURCES.items():
        try:
            raw = fetch(url)
        except Exception as e:
            print(f"Failed to fetch {platform}: {e}", file=sys.stderr)
            continue
        normalized = normalize(platform, raw)
        for name, targets in normalized.items():
            new_snapshot["programs"][f"{platform}:{name}"] = sorted(targets)

    if not old_snapshot:
        print("No previous snapshot found, saving baseline without alerting.")
        save_snapshot(new_snapshot)
        return

    changes = diff(old_snapshot, new_snapshot)
    if changes:
        message = "Scope changes detected:\n\n" + "\n".join(changes)
        print(message)
        send_telegram(message)
    else:
        print("No changes detected.")

    save_snapshot(new_snapshot)


if __name__ == "__main__":
    main()
