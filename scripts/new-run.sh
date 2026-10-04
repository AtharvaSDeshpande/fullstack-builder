#!/usr/bin/env bash
# Creates a unique run folder with a fresh run-log.md and prints its path.
# Usage: new-run.sh <project-dir> <words describing the run>
set -euo pipefail

PROJECT_DIR="${1:?project dir required}"
shift
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="$(printf '%s' "${*:-run}" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//; s/-$//' | cut -c1-40)"
[ -n "$SLUG" ] || SLUG="run"

RUNS_DIR="$PROJECT_DIR/docs/runs"
mkdir -p "$RUNS_DIR"
BASE="$RUNS_DIR/$(date +%Y%m%d-%H%M%S)-$SLUG"
RUN_DIR="$BASE"
n=1
# mkdir without -p is atomic, so two runs can never share a folder.
until mkdir "$RUN_DIR" 2>/dev/null; do
  n=$((n + 1))
  RUN_DIR="$BASE-$n"
done

RUN_ID="$(basename "$RUN_DIR")"
mkdir -p "$RUN_DIR/agents"
printf '%s\n' "$RUN_ID" > "$RUNS_DIR/CURRENT"
sed -e "s|{{RUN_ID}}|$RUN_ID|g" -e "s|{{STARTED}}|$(date '+%Y-%m-%d %H:%M:%S %z')|g" \
  "$SKILL_DIR/templates/run-log.template.md" > "$RUN_DIR/run-log.md"
printf '%s\n' "$RUN_DIR"
