# Ghitgud Roadmap

---

## v2.9.0 — Project Management & Milestones

**Why gh doesn't have it:** `gh project` commands are basic and new. No milestone commands exist. Subtask support (issue #10298) was only added to the API in 2025 and has no CLI support.

**Commands:**

- `ghg milestone create --title <name> --due <date>`
- `ghg milestone list --status open|closed`
- `ghg milestone close <name>`
- `ghg milestone progress <name>` — completion percentage
- `ghg project board <id>` — ASCII kanban view in terminal
- `ghg issue subtasks <issue>` — list/create/link subtasks
- `ghg issue parent <child> --parent <parent>`

**Value:** Makes ghg useful for project leads and Scrum masters who track sprint progress. The ASCII kanban board is a killer demo feature.

---

## v2.10.0 — Release Automation

**Why gh doesn't have it:** `gh release create --generate notes` exists but has no conventional commit support, no auto versioning, no changelog templates. Teams write custom release scripts.

**Commands:**

- `ghg release changelog` — generate changelog from conventional commits since last tag
- `ghg release bump` — auto detect next semver from commit types (feat → minor, fix → patch, BREAKING → major)
- `ghg release verify` — check attestation, signatures, and artifact integrity
- `ghg release notes --template <file>` — custom release notes template with template style variables
- `ghg release draft --level minor` — create draft release with auto generated notes

**Value:** Fully automated release pipeline from terminal. Connects commits to changelog to release in one command chain.

---

## v2.11.0 — Enterprise Security & Compliance

**Why gh doesn't have it:** Enterprise audit logs are API-only. No secret scanning management in CLI. Dependabot alerts require browser. Platform engineers need terminal access for compliance workflows.

**Commands:**

- `ghg audit` — query enterprise audit events with filters (actor, action, repo, date range)
- `ghg secrets scan` — scan repo history for leaked secrets (integrate with GitHub secret scanning API)
- `ghg secrets alerts` — list secret scanning alerts per repo
- `ghg dependabot list` — list Dependabot alerts with severity
- `ghg dependabot dismiss <alert> --reason <reason>`
- `ghg compliance check` — repo health score (license, README, CODEOWNERS, 2FA required, branch protection)

**Value:** Turns ghg into a security and compliance Swiss army knife for platform teams. This is where enterprise budget lives.

---

## v2.12.0 — GitHub Discussions

**Why gh doesn't have it:** `gh` has no `discussion` command family. Discussions are API-only and require extensions like `gh discussions` for terminal access.

**Commands:**

- `ghg discussion list` — list discussions by category
- `ghg discussion create --title <name> --category <name> --body <text>`
- `ghg discussion view <number>`
- `ghg discussion comment <number> --body <text>`
- `ghg discussion close/pin <number>`
- `ghg discussion categories` — list available categories

**Value:** Many OSS projects route Q&A and feature requests through Discussions. Maintainers can triage and respond without leaving the terminal.

---

## v2.13.0 — Variables & Environments

**Why gh doesn't have it:** `gh secret` exists but environment scoping and repository variables are API-only. Teams managing staging/production/development need browser access or raw `gh api` calls.

**Commands:**

- `ghg variable list --env <name>` — list repo variables with environment scoping
- `ghg variable set --env <name> --name <key> --value <val>`
- `ghg variable delete --env <name> --name <key>`
- `ghg environment list` — list configured environments
- `ghg environment create --name <name> --waittimer <seconds>`
- `ghg environment protection` — configure protection rules

**Value:** Teams managing multi environment CI/CD pipelines can inspect and modify configuration entirely from the terminal.

---

## v2.14.0 — Organization & Team Management

**Why gh doesn't have it:** No `gh org` or `gh team` commands. Collaborator and team access management requires scripting with `gh api` (issue #12529).

**Commands:**

- `ghg org listmembers` — list organization members
- `ghg org addmember --user <name> --role <role>`
- `ghg org removemember --user <name>`
- `ghg team list` — list teams in org
- `ghg team create --name <name> --description <desc>`
- `ghg team addmember --team <name> --user <name>`
- `ghg team removemember --team <name> --user <name>`
- `ghg repo invite <user> --role <role>`
- `ghg repo grant <team> --role <role>`

**Value:** Platform teams can provision repositories and manage access at scale without browser automation.

---

## v2.15.0 — GitHub Pages & Wiki

**Why gh doesn't have it:** No `gh pages` or `gh wiki` commands. Pages deployments and wiki edits require the web UI or Actions.

**Commands:**

- `ghg pages status` — current deployment status
- `ghg pages deploy --source <branch/folder>`
- `ghg pages unpublish`
- `ghg wiki list` — list wiki pages
- `ghg wiki view <page>`
- `ghg wiki edit <page> --file <path>`
- `ghg wiki create <page> --file <path>`

**Value:** Docs as code workflows get terminal native publishing and wiki editing without breaking flow.

---

## v2.16.0 — Merge Queue Management

**Why gh doesn't have it:** Merge queue is configured in repo settings with no CLI visibility. The April 2026 merge queue incident showed teams had no terminal access to queue state.

**Commands:**

- `ghg queue list` — PRs currently in merge queue
- `ghg queue status` — queue health and required checks
- `ghg queue add <pr>` — add PR to queue
- `ghg queue remove <pr>` — remove PR from queue
- `ghg queue history` — recent queue activity

**Value:** Teams using merge queues get terminal visibility and control without opening repo settings.

---

## v2.17.0 — Workspaces & Multi-Repo Operations

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

## v2.18.0 — Code Search & Navigation

**Why gh doesn't have it:** `gh search` is limited to text queries. No symbol navigation, definition lookup, or PR-aware blame exists.

**Commands:**

- `ghg code search <query> --repo <repo>` — semantic code search
- `ghg code definitions <symbol>` — find symbol definitions
- `ghg code references <symbol>` — find symbol references
- `ghg code file <path> --line <num>` — view file at specific commit
- `ghg code blame <file>` — enhanced blame with PR context

**Value:** Code review and debugging stay in the terminal without switching to the browser for navigation.

---

## v2.19.0 — Gists, Reactions & Comments

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

## v2.20.0 — Rulesets & Templates

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

## v2.21.0 — Issue Types

**Why gh doesn't have it:** GitHub introduced issue types (Bug, Feature, Task) in 2024. The CLI still has no support (issue #11976). Users must use direct API calls.

**Commands:**

- `ghg issue create --title <title> --type Bug|Feature|Task`
- `ghg issue list --type Bug`
- `ghg issue edit <num> --type Task`
- `ghg issue type list` — list available issue types for repo

**Value:** Issue types are becoming a core GitHub feature. CLI parity removes the need for API workarounds.
