#!/usr/bin/env bash
# Commits the current state as a local checkpoint so each agent's changes can be diffed and reverted.
# Usage: checkpoint.sh <project-dir> <message words>
set -euo pipefail

PROJECT_DIR="${1:?project dir required}"
shift
MESSAGE="${*:-checkpoint}"

cd "$PROJECT_DIR"
[ -d .git ] || git init -q
touch .gitignore
for entry in node_modules/ dist/ coverage/ .env; do
  grep -qxF "$entry" .gitignore || printf '%s\n' "$entry" >> .gitignore
done

git add -A
git -c user.name="fullstack-builder" -c user.email="fullstack-builder@localhost" \
  commit -q --allow-empty -m "checkpoint: $MESSAGE"
git rev-parse --short HEAD
