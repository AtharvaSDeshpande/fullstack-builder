# Sandbox for running fullstack-builder with any agent platform. The guard controls tool calls, not code the
# project runs, so this adds a hard boundary: the agent only sees /workspace, runs as a normal user, and the
# skill sits at a path with no spaces. Install your agent platform's CLI inside it (it is not included, so the
# image stays host-neutral).
#
#   docker build -f container/Dockerfile -t fullstack-builder-sandbox .
#   docker run --rm -it -v "$PWD/work":/workspace fullstack-builder-sandbox bash
#
# Inside, run the host CLI from /workspace and point it at /opt/skills/fullstack-builder. Outbound network is
# needed for `npm install` and for the model API; restrict it with your own Docker network rules if you need to.
FROM node:20-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git bash ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY . /opt/skills/fullstack-builder
RUN useradd --create-home --uid 1001 builder \
 && mkdir /workspace \
 && chown builder:builder /workspace \
 && git config --system user.name "fullstack-builder" \
 && git config --system user.email "fullstack-builder@localhost"

USER builder
WORKDIR /workspace
RUN node /opt/skills/fullstack-builder/scripts/guard-selftest.mjs > /tmp/selftest.log 2>&1 || (cat /tmp/selftest.log; exit 1)
