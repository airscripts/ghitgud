# Ghitgud Roadmap

---

## g4h5i6j7 — Workspaces & Multi-Repo Operations

**Why gh doesn't have it:** `gh` is strictly single repo. Developers managing many repos resort to tools like `repos` CLI or custom scripts to check status and run commands across projects.

**Commands:**

- `ghg workspace define --name <name> --repos <list>` — define a named workspace
- `ghg workspace run --command <cmd>` — run a command across workspace repos
- `ghg repo syncall` — update all local clones from remotes
- `ghg repo statusall` — check status across multiple repos
- `ghg branch stale` — list branches older than N days, merged, deleted upstream
- `ghg branch sweep --pattern <pattern> --dry`

**Value:** Developers with 10+ repositories get bulk operations and workspace-wide commands without context switching.

---

## k8l9m0n1 — Code Search & Navigation

**Why gh doesn't have it:** `gh search` is limited to text queries. No symbol navigation, definition lookup, or PR-aware blame exists.

**Commands:**

- `ghg code search <query> --repo <repo>` — semantic code search
- `ghg code definitions <symbol>` — find symbol definitions
- `ghg code references <symbol>` — find symbol references
- `ghg code file <path> --line <num>` — view file at specific commit
- `ghg code blame <file>` — enhanced blame with PR context

**Value:** Code review and debugging stay in the terminal without switching to the browser for navigation.

---

## o2p3q4r5 — Gists, Reactions & Comments

**Why gh doesn't have it:** `gh gist` supports create/list/view but lacks editing, forking, and starring. No `gh react` command exists. No thread reply support.

**Commands:**

- `ghg gist fork <id>` — fork a gist
- `ghg gist star/unstar <id>`
- `ghg gist comment <id> --body <text>`
- `ghg gist search <query>` — search public gists
- `ghg react <pr/issue> --comment <id> --emoji <name>` — add emoji reactions
- `ghg comment reply --to <id> --body <text>` — reply to a comment thread
- `ghg comment list <pr/issue>` — list all comments with IDs
- `ghg comment delete <id>`

**Value:** Terminal-native engagement for gists and PR/issue conversations without opening the browser.

---

## s6t7u8v9 — Rulesets & Templates

**Why gh doesn't have it:** `gh ruleset` only supports `view`. No create/edit/delete commands. Issue template discovery is broken and label sync across repos requires custom scripts.

**Commands:**

- `ghg template list` — list available issue/PR templates
- `ghg template show <name>` — preview template
- `ghg label bulk --file <path>` — create labels from JSON/YAML
- `ghg label sync --source <repo>` — sync labels from another repo

**Value:** Organizations managing 100+ repos get rulesets as code and template discovery that actually works.

---

## w0x1y2z3 — Issue Types

**Why gh doesn't have it:** GitHub introduced issue types (Bug, Feature, Task) in 2024. The CLI still has no support. Users must use direct API calls.

**Commands:**

- `ghg issue create --title <title> --type Bug|Feature|Task`
- `ghg issue list --type Bug`
- `ghg issue edit <num> --type Task`
- `ghg issue type list` — list available issue types for repo

**Value:** Issue types are becoming a core GitHub feature. CLI parity removes the need for API workarounds.

---

## a4b5c6d7 — Webhook Management

**Why gh doesn't have it:** No webhook CLI commands exist. Every integration touches webhooks and configuration currently requires the browser.

**Commands:**

- `ghg webhook list [--repo <repo>] [--org <org>]`
- `ghg webhook create --url <url> --events <events> [--secret <secret>] [--content-type json|form]`
- `ghg webhook edit <id> --url <url> --events <events>`
- `ghg webhook delete <id> [--yes]`
- `ghg webhook test <id>` — trigger a test delivery
- `ghg webhook delivery list <id>` — recent delivery attempts
- `ghg webhook delivery view <delivery-id>` — request/response details
- `ghg webhook delivery redeliver <delivery-id>`

**Value:** Every integration touches webhooks. End-to-end lifecycle from the terminal.

---

## e8f9g0h1 — Fork Management

**Why gh doesn't have it:** `gh repo fork` creates forks but doesn't manage them. There's no sync, compare, or bulk fork management.

**Commands:**

- `ghg fork sync [--repo <fork>] [--upstream <upstream>]` — fast-forward a fork from upstream
- `ghg fork compare [--repo <fork>] [--upstream <upstream>]` — show ahead/behind status
- `ghg fork list [--owner <user>]` — list all forks with sync status
- `ghg fork create <repo> [--clone] [--remote]` — create fork with remote setup

**Value:** Every open source contributor deals with fork sync daily. This is a clear gh gap.

---

## i2j3k4l5 — Actions Cost & Usage Analytics

**Why gh doesn't have it:** No CLI tooling exists for Actions billing data. Teams managing CI budgets have zero terminal visibility.

**Commands:**

- `ghg actions usage [--org <org>] [--repo <repo>] [--period <30d|90d|current-month>]`
- `ghg actions cost [--org <org>] [--repo <repo>]` — cost breakdown by workflow
- `ghg actions top-spenders [--org <org>] [--limit <n>]` — top workflows by minutes/cost
- `ghg actions usage export --format csv|json` — export for billing

**Value:** For orgs managing CI budgets, this is a real pain point with zero CLI tooling.

---

## m6n7o8p9 — Branch & Tag Protection

**Why gh doesn't have it:** No branch/tag protection CLI commands exist. Rulesets are the modern system, but classic protection is still widely used and has no CLI.

**Commands:**

- `ghg branch protect <pattern> [--required-checks <checks>] [--required-reviews <n>] [--dismiss-stale]`
- `ghg branch unprotect <pattern>`
- `ghg branch protection list [--repo <repo>]`
- `ghg tag protect <pattern>`
- `ghg tag unprotect <pattern>`

**Value:** Complements the ruleset commands. Classic protection is still the default for most repos.

---

## q0r1s2t3 — Actions Live Log Streaming

**Why gh doesn't have it:** `gh run watch` exists but is basic. No filtering, tail mode, or JSON output. No cancel during watch.

**Commands:**

- `ghg run watch <run-id> [--tail] [--filter <pattern>] [--json]` — live log streaming
- `ghg run watch --follow` — follow a running workflow

**Value:** Live streaming is a different workflow from post-hoc log fetching. Invaluable during CI debugging.

---

## u4v5w6x7 — Dependency Graph & Advisory Data

**Why gh doesn't have it:** No dependency CLI commands exist. Dependabot alerts are surfaced in ghg but the dependency graph and advisory database are not.

**Commands:**

- `ghg deps list [--repo <repo>] [--manifest <path>]` — show dependency tree
- `ghg deps direct [--repo <repo>]` — direct dependencies only
- `ghg deps outdated [--repo <repo>]` — dependencies with newer versions
- `ghg advisory list [--ecosystem npm|pip|...] [--severity <level>]` — query GitHub Advisory Database
- `ghg advisory view <GHSA-id>`

**Value:** Growing concern with zero CLI tooling. Natural extension of the existing security surface.

---

## y8z9a0b1 — Deployment Tracking

**Why gh doesn't have it:** No deployment CLI commands exist. ghg already has environment and protection commands.

**Commands:**

- `ghg deployment list [--repo <repo>] [--environment <name>] [--limit <n>]`
- `ghg deployment view <id>`
- `ghg deployment create --ref <branch|sha> --environment <name> [--description <text>] [--auto-merge]`
- `ghg deployment status <id>`
- `ghg deployment status create <id> --state success|failure|in_progress --description <text>`

**Value:** Complements the existing environments/variables/secrets surface. Track deployments without leaving the terminal.

---

## c2d3e4f5 — Package & Container Registry

**Why gh doesn't have it:** No package management CLI commands exist. GHCR is growing fast.

**Commands:**

- `ghg package list [--org <org>] [--repo <repo>] [--type npm|docker|maven|...]`
- `ghg package view <package-name>`
- `ghg package versions <package-name>`
- `ghg package delete <package-name> --version <version> [--yes]`
- `ghg package restore <package-name> --version <version>`
- `ghg package download <package-name> --version <version> --output <file>`

**Value:** GHCR is growing fast. Managing container images and packages from the terminal rounds out the repo management story.

---

## g6h7i8j9 — Self-Hosted Runner Management

**Why gh doesn't have it:** No runner CLI commands exist. Orgs with self-hosted runners have zero CLI tooling.

**Commands:**

- `ghg runner list [--repo <repo>] [--org <org>] [--label <label>]`
- `ghg runner view <id>`
- `ghg runner status <id>` — health and busy status
- `ghg runner remove <id> [--yes]`
- `ghg runner labels <id>` — list labels for a runner

**Value:** Niche but orgs with self-hosted runners have zero CLI tooling.

---

## k0l1m2n3 — CodeQL Alert Management

**Why gh doesn't have it:** No CodeQL CLI commands exist. ghg already has dependabot, leaks, audit, and compliance commands.

**Commands:**

- `ghg codeql list [--repo <repo>] [--severity critical|high|medium|low] [--state open|fixed]`
- `ghg codeql view <alert-id>`
- `ghg codeql dismiss <alert-id> --reason <reason> [--comment <text>]`

**Value:** Rounds out the security suite. CodeQL alerts are a growing concern for security-focused teams.

---

## o4p5q6r7 — Security Advisories

**Why gh doesn't have it:** No advisory CLI commands exist. ghg already has a security surface (dependabot, leaks, audit, compliance).

**Commands:**

- `ghg advisory list [--repo <repo>] [--state published|draft|triage]`
- `ghg advisory view <id>`
- `ghg advisory create --title <title> --description <text> --severity critical|high|medium|low`
- `ghg advisory publish <id>`
- `ghg advisory close <id>`
- `ghg advisory cve-request <id>`

**Value:** Security advisories are a growing concern. Nobody owns this CLI space yet.
