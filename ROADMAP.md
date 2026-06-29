# Ghitgud Roadmap

---

## e4f5a6b7 — Pull Request CRUD

**Why gh doesn't have it:** `gh pr` covers create/list/view/edit/merge/close. ghg has cleanup, push, next, and stacked PRs — excellent workflow features — but no basic PR lifecycle.

**Gap:** Basic PR creation, listing, merging, viewing, diff, and checks. The API layer already has `pr.createPr` and `pr.updatePr`.

**Commands:**

- `ghg pr create --title <title> --body <text> --base <branch> --head <branch> [--draft]`
- `ghg pr list [--state open|closed|merged|all] [--base <branch>] [--head <branch>]`
- `ghg pr view <number>`
- `ghg pr edit <number> --title <title> --body <text>`
- `ghg pr close <number>`
- `ghg pr reopen <number>`
- `ghg pr merge <number> [--merge|--squash|--rebase] [--delete-branch]`
- `ghg pr checkout <number>`
- `ghg pr diff <number>`
- `ghg pr checks <number>` — show CI status for a PR
- `ghg pr comment <number> --body <text>`
- `ghg pr lock <number>`
- `ghg pr unlock <number>`
- `ghg pr ready <number>` — mark draft as ready for review
- `ghg pr status` — show relevant PRs across repos

**Value:** PRs are the core of GitHub collaboration. ghg's stacked PR and cleanup workflows are excellent but need the CRUD foundation.

---

## c8d9e0f1 — Auth

**Why gh doesn't have it:** `gh auth login` is the standard entry point. ghg's profile system (add/list/switch/detect) is more flexible for multi-account workflows but lacks a login/logout flow and token printing.

**Gap:** No interactive or token-based login, no logout, no token display, no git credential setup.

**Commands:**

- `ghg auth login [--token <token>] [--web]` — interactive or token-based login
- `ghg auth logout [--hostname <host>]`
- `ghg auth status` — show current auth state
- `ghg auth token` — print current token
- `ghg auth setup-git` — configure git with ghg credentials

**Value:** Auth is the entry point. Without a proper login flow, new users cannot get started easily.

---

## g2h3i4j5 — Search

**Why gh doesn't have it:** `gh search` covers repos/issues/prs/code/commits. ghg has no search at all.

**Gap:** No search capability across any GitHub entity type.

**Commands:**

- `ghg search code <query> [--repo <repo>] [--language <lang>]`
- `ghg search issues <query> [--repo <repo>] [--state open|closed]`
- `ghg search prs <query> [--repo <repo>] [--state open|closed|merged]`
- `ghg search repos <query> [--topic <topic>] [--language <lang>]`
- `ghg search commits <query> [--repo <repo>] [--author <user>]`

**Value:** Search is a fundamental GitHub feature. Without it, users must open the browser for any search workflow.

---

## k6l7m8n9 — Repository CRUD

**Why gh doesn't have it:** `gh repo` covers create/list/view/clone/delete/archive/fork/rename. ghg has inspect/govern/label/retire/report/clone/invite/grant — powerful governance — but no basic repo operations.

**Gap:** No create, view, delete, archive, rename, edit, fork, or sync commands. The API layer already has `repos.archive`.

**Commands:**

- `ghg repo create <name> [--public|--private|--internal] [--description <text>] [--template <repo>]`
- `ghg repo list [--owner <user|org>] [--type public|private|all]`
- `ghg repo view [--owner/repo]`
- `ghg repo clone <repo> [--depth <n>]` — extends existing `repos clone`
- `ghg repo delete <repo> [--yes]`
- `ghg repo archive <repo>` — uses existing `repos.archive` API
- `ghg repo unarchive <repo>`
- `ghg repo rename <repo> <new-name>`
- `ghg repo edit <repo> --description <text> --homepage <url> --visibility public|private`
- `ghg repo fork <repo> [--clone] [--remote-name <name>]`
- `ghg repo sync [--branch <name>]`
- `ghg repo set-default <repo>`

**Value:** Repo management is table stakes. ghg's governance features are a differentiator, but basic CRUD is required for standalone use.

---

## o0p1q2r3 — Release CRUD

**Why gh doesn't have it:** `gh release` covers create/list/view/edit/delete/download/upload. ghg has changelog/bump/verify/notes/draft — excellent automation — but no basic release management.

**Gap:** No list, view, edit, delete, download, or upload for releases. The API layer already has `releases.fetchByTag` and `releases.create`.

**Commands:**

- `ghg release list [--limit <n>]`
- `ghg release view <tag>`
- `ghg release create <tag> [--title <title>] [--notes <text>] [--draft] [--prerelease] [--latest]`
- `ghg release edit <tag> --title <title> --notes <text>`
- `ghg release delete <tag> [--yes]`
- `ghg release download <tag> [--pattern <glob>] [--output-dir <dir>]`
- `ghg release upload <tag> <files...> [--clobber]`
- `ghg release delete-asset <tag> <asset-name>`

**Value:** Release automation is a strength, but basic release management is needed for parity.

---

## s4t5u6v7 — Workflow Run Management

**Why gh doesn't have it:** `gh run` covers cancel/delete/download/list/rerun/view/watch. ghg has `run debug` — a deep debug bundle — but no basic run management.

**Gap:** No list, view, cancel, rerun, delete, or watch commands. The API layer already has `getRun`, `listRunJobs`, `downloadRunLogs`, `listRunArtifacts`, and `downloadArtifact`.

**Commands:**

- `ghg run list [--workflow <name>] [--branch <name>] [--status <status>] [--limit <n>]`
- `ghg run view <run-id>`
- `ghg run cancel <run-id>`
- `ghg run rerun <run-id> [--failed-jobs]`
- `ghg run delete <run-id> [--yes]`
- `ghg run watch <run-id> [--tail] [--filter <pattern>]`
- `ghg run download <run-id> [--pattern <glob>] [--output-dir <dir>]`

**Value:** Actions runs are a daily workflow for CI-heavy teams. The debug feature is excellent, but basic management is essential.

---

## w8x9y0z1 — Workflow Management

**Why gh doesn't have it:** `gh workflow` covers list/run/view/enable/disable. ghg has validate and preview — unique value — but no basic workflow lifecycle.

**Gap:** No list, run, view, enable, or disable commands.

**Commands:**

- `ghg workflow list [--all]`
- `ghg workflow view <name|id>`
- `ghg workflow run <name|id> [--ref <branch>] [--field key=value]`
- `ghg workflow enable <name|id>`
- `ghg workflow disable <name|id>`

**Value:** Complements the existing validate/preview commands. Basic workflow lifecycle management.

---

## a2b3c4d5 — Cache Management

**Why gh doesn't have it:** `gh cache` covers list/delete. ghg has inspect and download — deeper than gh — but no list or delete.

**Gap:** No listing or deletion of caches. The API layer already has `listCaches`.

**Commands:**

- `ghg cache list [--key <pattern>] [--limit <n>]` — uses existing `listCaches` API
- `ghg cache delete <key> [--all] [--yes]`

**Value:** Small gap. ghg's inspect/download are deeper than gh. List and delete complete the picture.

---

## e6f7g8h9 — Gist CRUD

**Why gh doesn't have it:** `gh gist` covers clone/create/delete/edit/list/view. ghg has nothing for gists.

**Gap:** No gist support at all.

**Commands:**

- `ghg gist list [--public] [--limit <n>]`
- `ghg gist view <id> [--raw]`
- `ghg gist create <files...> [--description <text>] [--public]`
- `ghg gist edit <id> [--add <file>] [--remove <file>]`
- `ghg gist delete <id> [--yes]`
- `ghg gist clone <id> [--dir <dir>]`

**Value:** Gists are a lightweight sharing mechanism. Basic CRUD is needed for parity.

---

## i0j1k2l3 — Label CRUD

**Why gh doesn't have it:** `gh label` covers create/delete/edit/list/clone. ghg has list/pull/push/prune — template-driven bulk operations — but no individual label CRUD.

**Gap:** No create, edit, delete, or clone for individual labels. The API layer already has `labels.create`, `labels.patch`, and `labels.delete`.

**Commands:**

- `ghg label create <name> [--color <hex>] [--description <text>]` — uses existing `labels.create` API
- `ghg label edit <name> [--new-name <name>] [--color <hex>] [--description <text>]` — uses existing `labels.patch` API
- `ghg label delete <name> [--yes]` — uses existing `labels.delete` API
- `ghg label clone --source <repo> [--target <repo>]`

**Value:** Individual label management is a common task. The API layer already supports this. The template system handles bulk operations.

---

## m4n5o6p7 — Project CRUD

**Why gh doesn't have it:** `gh project` covers close/copy/create/delete/edit/field-create/field-delete/field-list/item-add/item-archive/item-create/item-edit/item-list/link/list/mark-template/unlink/view. ghg has `project board` — a beautiful ASCII kanban — but no project management commands.

**Gap:** No project lifecycle management. The API layer already has `projects.board` via GraphQL.

**Commands:**

- `ghg project list [--owner <user|org>] [--limit <n>]`
- `ghg project view <id> [--owner <user|org>]`
- `ghg project create --title <title> [--owner <user|org>]`
- `ghg project edit <id> --title <title> --description <text>`
- `ghg project close <id>`
- `ghg project delete <id> [--yes]`
- `ghg project item-list <id> [--limit <n>]`
- `ghg project item-add <id> --issue <number>`
- `ghg project item-create <id> --title <title> --body <text>`
- `ghg project field-list <id>`
- `ghg project link <id> --repo <repo>`
- `ghg project unlink <id> --repo <repo>`

**Value:** Projects V2 is a core GitHub planning tool. The ASCII board is a showcase feature, but it needs the management layer.

---

## q8r9s0t1 — Ruleset CRUD

**Why gh doesn't have it:** `gh ruleset` only supports check/list/view. ghg has no direct ruleset commands, but the API layer already has `rulesets.list`, `rulesets.create`, and `rulesets.update`, and `repos govern` uses rulesets for bulk governance.

**Gap:** No direct ruleset commands. The API and governance service already handle rulesets internally.

**Commands:**

- `ghg ruleset list [--repo <repo>] [--org <org>]`
- `ghg ruleset view <id>`
- `ghg ruleset check <branch>` — check which rules apply to a branch
- `ghg ruleset create --file <path>` — create from JSON/YAML definition
- `ghg ruleset edit <id> --file <path>` — uses existing `rulesets.update` API
- `ghg ruleset delete <id> [--yes]`
- `ghg ruleset validate --file <path>` — validate before applying

**Value:** Rulesets are GitHub's modern branch protection. ghg can go beyond gh's read-only support with create/edit/delete.

---

## u2v3w4x5 — Cross-Repo Status

**Why gh doesn't have it:** `gh status` shows a cross-repo overview of issues, PRs, and reviews. ghg has notification and mention tracking but no aggregated status dashboard.

**Gap:** No cross-repo overview command.

**Commands:**

- `ghg status [--org <org>] [--exclude <repos>]` — cross-repo overview of issues, PRs, reviews, mentions

**Value:** A daily-use command that aggregates all your GitHub work into one view. Natural complement to notifications and mentions.

---

## y6z7a8b9 — API Passthrough

**Why gh doesn't have it:** `gh api` gives raw API access with pagination and jq filtering. ghg has no equivalent.

**Gap:** Power users have no way to hit arbitrary GitHub API endpoints.

**Commands:**

- `ghg api <endpoint> [--method <method>] [--field key=value] [--paginate] [--jq <query>] [--silent]`

**Value:** Essential for power users and scripting. Eliminates the need to fall back to `gh` or `curl` for ad hoc queries.

---

## c0d1e2f3 — Merge Queue Management

**Why gh doesn't have it:** Merge queue is configured in repo settings with no CLI visibility. The April 2026 merge queue incident showed teams had no terminal access to queue state.

**Commands:**

- `ghg queue list` — PRs currently in merge queue
- `ghg queue status` — queue health and required checks
- `ghg queue add <pr>` — add PR to queue
- `ghg queue remove <pr>` — remove PR from queue
- `ghg queue history` — recent queue activity

**Value:** Teams using merge queues get terminal visibility and control without opening repo settings.

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
