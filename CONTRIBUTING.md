# Contributing

This is a proof of concept, and contributions are welcome. Read `SKILL.md` first: it is the design.

## Run the checks

```bash
node scripts/guard-selftest.mjs    # the guard's rules, through the real hook
node scripts/smoke-test.mjs        # a whole run with stub agents
node scripts/validate-spec.mjs examples/site.spec.json
```

Both test scripts need Node 18 or later and no network. CI runs them on Node 18, 20 and 22, on Linux and macOS. Change a rule in `guard/`, `guard/profiles.json` or `scripts/`, and add a case to `guard-selftest.mjs` that fails without your change.

## Adding support for another agent platform

1. Capture what the platform really sends to a pre-tool-call hook (tool names, the input fields, how a sub-agent is identified) from its documentation or from a captured payload.
2. Add an entry to `guard/adapters.json` and a branch in `scripts/setup.mjs` (`HOSTS`), using only names you have verified. The guard blocks tools it does not recognise, so a wrong guess fails closed, but do not list names you have not seen.
3. Add selftest cases that feed the platform's payload shape through the guard.
4. Say in the pull request how you tested it on the real platform, and whether the hook still fired in later sessions. Do not claim enforcement for a platform that was only run in advisory mode.

## Pull requests

- Keep changes small and say which `TODO.md` item they close, and remove it from the list.
- Do not weaken a guard rule to make a test pass. If a rule is too strict, change `guard/profiles.json` and explain why.
- Do not commit `.env` files, keys, or run folders from your own projects.
- Docs must match the code: if you change a command or a number, search the README and `SKILL.md` for it.

By contributing you agree your work is released under the MIT license in `LICENSE`.
