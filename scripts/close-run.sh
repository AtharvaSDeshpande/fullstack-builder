#!/usr/bin/env bash
# Sets the final status and finish time of a run and adds one line to INDEX.md.
# Usage: close-run.sh <run-dir> <status> <summary words>
set -euo pipefail

RUN_DIR="${1:?run dir required}"
STATUS="${2:?status required}"
shift 2
SUMMARY="${*:-no summary}"
RUN_ID="$(basename "$RUN_DIR")"
INDEX="$(dirname "$RUN_DIR")/INDEX.md"
FINISHED="$(date '+%Y-%m-%d %H:%M:%S %z')"

sed -i.bak -e "s|^Finished: .*|Finished: $FINISHED|" -e "s|^Status: .*|Status: $STATUS|" "$RUN_DIR/run-log.md"
rm -f "$RUN_DIR/run-log.md.bak"
printf '%s | %s | %s\n' "$RUN_ID" "$SUMMARY" "$STATUS" >> "$INDEX"
CURRENT="$(dirname "$RUN_DIR")/CURRENT"
[ -f "$CURRENT" ] && [ "$(cat "$CURRENT")" = "$RUN_ID" ] && rm -f "$CURRENT"
true
