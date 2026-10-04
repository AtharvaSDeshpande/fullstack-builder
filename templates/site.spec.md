# Site Spec (Markdown)

Fill every line. Headings use the same keys as the JSON spec. The PM converts this file to `site.spec.normalized.json` word for word and never fills a required field you leave blank. Everything outside the required list is optional but gives the agents more to work from. Required: project (name, slug, summary), audience (primary_users), languages (default, supported), stack (frontend framework, backend mode), at least 1 feature, at least 1 screen, at least 3 acceptance statements.

## project
- name:
- slug: (kebab-case)
- type: (web-app | marketing-site | dashboard | ecommerce | portal | internal-tool)
- summary:

## meta
- created by / on:
- client and decision maker:
- interview mode: (quick | full | hand-written)

## business
- problem:
- why now:
- goals: (one per line)
- success metrics: (metric | target or "set after baseline" | baseline or "unknown" | how measured)
- business model:
- stakeholders: (role | what they decide)
- competitors: (name | note, or "none known")
- differentiators:
- launch: (date | pilot, public or internal)
- budget:

## audience
- primary_users:
- devices:
- network:
- notes:
- personas: (id | name | description | goals | pain points | tech comfort low/medium/high | devices | languages | frequency)

## journeys
(id | persona id | goal | steps separated by > | success condition | feature ids)
-

## roles
(id | name | can | cannot)
-

## brand
- name_constant:
- logo: (original-svg | provided path)
- tone:
- forbidden:

## languages
- default:
- supported: (comma separated)
- currency:

## stack
- frontend: (framework, ui library, router)
- backend mode: (mock | real | none)
- backend runtime and framework: (only if real)
- database engine: (required if real)
- auth method:
- deploy target:

## features
(one per line: id | name | priority must/should/could | description | screens | tags)
-

## screens
(one per line: id | name | route | auth required yes/no | feature ids)
-

## data
- entities: (name: field, field, ...)
- seed minimum records:
- seed source files:

## api
(optional, one per line: METHOD /path | purpose)
-

## integrations
(optional; mocked unless you write "real")
-

## nonfunctional
- performance:
- accessibility: (default WCAG AA)
- breakpoints: (default 360, 768, 1280)
- browsers:
- security:
- seo: (true | false)
- performance budget: (max bundle KB or "report only"; target load)

## constraints
- libraries forbidden:
- forbidden packages (blocked in shell commands by the guard):
- no external images: (true | false)
- secrets: (env | test-only-inline)
- max agent calls: (default 25)
- never:

## design
- style:
- references: (URLs or apps the client likes)
- avoid:
- colors / fonts:
- dark mode: (yes | no)
- density: (compact | comfortable)
- logo notes / imagery:

## content
- voice:
- copy owner:
- sample phrases:
- legal pages:
- translation review:

## notifications
- channels / events:

## payments
- needed: (yes | no)
- methods / provider:
- mocked: (yes | no)

## analytics
- tool:
- events: (name | when it fires)
- privacy notes:

## compliance
- data collected:
- contains PII: (yes | no)
- regulations:
- consent / retention / data residency / age limit:

## operations
- hosting / environments / domain:
- monitoring / backups / ci:
- support contact role:

## timeline
- deadline: (hard? yes | no)
- milestones: (name | when | deliverable)

## risks
(risk | impact low/medium/high | mitigation)
-

## dependencies
(what we wait on | owner)
-

## assumptions
(statement | confirmed by client yes/no)
-

## decisions
(topic | answer | source: client, document or pm-default)
-

## open_questions
(question | owner | needed by)
-

## acceptance
(you write these; testable sentences; at least 3)
1.
2.
3.

## out_of_scope
-

## unknowns
(things the PM must not assume)
-
