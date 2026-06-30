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

## i2j3k4l5 — Actions Cost & Usage Analytics

**Why gh doesn't have it:** No CLI tooling exists for Actions billing data. Teams managing CI budgets have zero terminal visibility.

**Commands:**

- `ghg actions usage [--org <org>] [--repo <repo>] [--period <30d|90d|current-month>]`
- `ghg actions cost [--org <org>] [--repo <repo>]` — cost breakdown by workflow
- `ghg actions top-spenders [--org <org>] [--limit <n>]` — top workflows by minutes/cost
- `ghg actions usage export --format csv|json` — export for billing

**Value:** For orgs managing CI budgets, this is a real pain point with zero CLI tooling.

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
