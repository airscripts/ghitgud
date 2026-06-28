# Ghitgud Roadmap

---

## e5f6g7h8 — Merge Queue Management

**Why gh doesn't have it:** Merge queue is configured in repo settings with no CLI visibility. The April 2026 merge queue incident showed teams had no terminal access to queue state.

**Commands:**

- `ghg queue list` — PRs currently in merge queue
- `ghg queue status` — queue health and required checks
- `ghg queue add <pr>` — add PR to queue
- `ghg queue remove <pr>` — remove PR from queue
- `ghg queue history` — recent queue activity

**Value:** Teams using merge queues get terminal visibility and control without opening repo settings.

---

## i9j0k1l2 — Workspaces & Multi-Repo Operations

**Why gh doesn't have it:** `gh` is strictly single repo. Developers managing many repos resort to tools like `repos` CLI or custom scripts to check status and run commands across projects.

**Commands:**

- `ghg workspace define --name <name> --repos <list>` — define a named workspace
- `ghg workspace run --command <cmd>` — run a command across workspace repos
- `ghg repo syncall` — update all local clones from remotes
- `ghg repo statusall` — check status across multiple repos
- `ghg branch stale` — list branches older than N days, merged, deleted upstream
- `ghg branch sweep --pattern <pattern> --dry`

**Value:** Developers with 10+ repositories get bulk operations and workspace wide commands without context switching.

---

## m3n4o5p6 — Code Search & Navigation

**Why gh doesn't have it:** `gh search` is limited to text queries. No symbol navigation, definition lookup, or PR-aware blame exists.

**Commands:**

- `ghg code search <query> --repo <repo>` — semantic code search
- `ghg code definitions <symbol>` — find symbol definitions
- `ghg code references <symbol>` — find symbol references
- `ghg code file <path> --line <num>` — view file at specific commit
- `ghg code blame <file>` — enhanced blame with PR context

**Value:** Code review and debugging stay in the terminal without switching to the browser for navigation.

---

## q7r8s9t0 — Gists, Reactions & Comments

**Why gh doesn't have it:** `gh gist` supports create/list/view but lacks editing, forking, and starring. No `gh react` command exists (issue #11248). No thread reply support (issue #11552).

**Commands:**

- `ghg gist edit <id> --file <name>` — edit a gist file
- `ghg gist fork <id>` — fork a gist
- `ghg gist star/unstar <id>`
- `ghg gist comment <id> --body <text>`
- `ghg gist search <query>` — search public gists
- `ghg react <pr/issue> --comment <id> --emoji <name>` — add emoji reactions
- `ghg comment reply --to <id> --body <text>` — reply to a comment thread
- `ghg comment list <pr/issue>` — list all comments with IDs
- `ghg comment delete <id>`

**Value:** Terminal native engagement for gists and PR/issue conversations without opening the browser.

---

## u1v2w3x4 — Rulesets & Templates

**Why gh doesn't have it:** `gh ruleset` only supports `view`. No create/edit/delete commands. Issue template discovery is broken (issue #11681) and label sync across repos requires custom scripts.

**Commands:**

- `ghg ruleset list` — list repo/org rulesets
- `ghg ruleset create --file <path>` — create from JSON/YAML definition
- `ghg ruleset edit <id> --file <path>`
- `ghg ruleset delete <id>`
- `ghg ruleset validate --file <path>` — validate ruleset before applying
- `ghg template list` — list available issue/PR templates
- `ghg template show <name>` — preview template
- `ghg label bulk --file <path>` — create labels from JSON/YAML
- `ghg label sync --source <repo>` — sync labels from another repo

**Value:** Organizations managing 100+ repos get rulesets as code and template discovery that actually works.

---

## y5z6a7b8 — Issue Types

**Why gh doesn't have it:** GitHub introduced issue types (Bug, Feature, Task) in 2024. The CLI still has no support (issue #11976). Users must use direct API calls.

**Commands:**

- `ghg issue create --title <title> --type Bug|Feature|Task`
- `ghg issue list --type Bug`
- `ghg issue edit <num> --type Task`
- `ghg issue type list` — list available issue types for repo

**Value:** Issue types are becoming a core GitHub feature. CLI parity removes the need for API workarounds.
