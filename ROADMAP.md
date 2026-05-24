# Ghitgud Roadmap

---

## v2.6.0 — CI/CD Developer Experience

**Why gh doesn't have it:** Issue #9125 (cache download, May 2024) and no workflow validation/dry-run support. Debugging CI failures requires browser navigation and guesswork.

**Commands:**

- `ghg workflow validate` — lint workflow YAML against GitHub's schema before pushing
- `ghg workflow dry-run` — preview job matrix, runner selection, execution path
- `ghg cache download <key>` — download Actions cache artifact for local debugging
- `ghg cache inspect <key>` — list contents of a cache without downloading
- `ghg run debug <run-id>` — fetch logs + annotations + failed step artifacts in one command

**Value:** Cuts CI debugging time dramatically. The validation and dry-run features prevent "push and pray" workflows.

---

## v2.7.0 — Advanced Code Review

**Why gh doesn't have it:** Issue #359 (fine-grained review, Feb 2020) — `gh pr review` only supports approve/request-changes/comment. No line-specific comments, no thread management.

**Commands:**

- `ghg review comment --file <path> --line <num> --body <text> --pr <num>`
- `ghg review threads <pr>` — list all review threads with resolution status
- `ghg review resolve <thread-id>` — mark a thread as resolved
- `ghg review suggest --file <path> --line <num> --replace <text>` — create a suggestion
- `ghg review apply-suggestions <pr>` — batch-apply all suggestions from a review

**Value:** Maintainers can do meaningful code review entirely from the terminal. This is the biggest missing piece of `gh`'s PR workflow.

---

## v2.8.0 — Interactive TUI Mode

**Why gh doesn't have it:** `gh` outputs flat text only. Extension `gh-dash` (very popular) proves massive demand for a rich terminal UI, but it's external and limited.

**Commands:**

- `ghg tui` — launch full-screen terminal UI
- Browse PRs/issues with keyboard navigation (vim bindings)
- View diffs with syntax highlighting in-terminal
- Inline comment and approve without leaving TUI
- Filterable, sortable tables with live refresh
- Split-pane view: PR list on left, diff on right

**Value:** A terminal-native GitHub dashboard that doesn't break flow. Developers who live in tmux/neovim will never leave the terminal.

---

## v2.9.0 — Project Management & Milestones

**Why gh doesn't have it:** `gh project` commands are basic and new. No milestone commands exist. Sub-task support (issue #10298) was only added to the API in 2025 and has no CLI support.

**Commands:**

- `ghg milestone create --title <name> --due-date <date>`
- `ghg milestone list --status open|closed`
- `ghg milestone close <name>`
- `ghg milestone progress <name>` — completion percentage
- `ghg project board <project-id>` — ASCII kanban view in terminal
- `ghg issue subtasks <issue>` — list/create/link sub-tasks
- `ghg issue set-parent <child> --parent <parent>`

**Value:** Makes ghg useful for project leads and Scrum masters who track sprint progress. The ASCII kanban board is a killer demo feature.

---

## v2.10.0 — Release Automation

**Why gh doesn't have it:** `gh release create --generate-notes` exists but has no conventional commit support, no auto-versioning, no changelog templates. Teams write custom release scripts.

**Commands:**

- `ghg release changelog` — generate changelog from conventional commits since last tag
- `ghg release bump` — auto-detect next semver from commit types (feat → minor, fix → patch, BREAKING → major)
- `ghg release verify` — check attestation, signatures, and artifact integrity
- `ghg release notes --template <file>` — custom release notes template with Go-template style variables
- `ghg release draft --bump minor` — create draft release with auto-generated notes

**Value:** Fully automated release pipeline from terminal. Connects commits to changelog to release in one command chain.

---

## v2.11.0 — Enterprise Security & Compliance

**Why gh doesn't have it:** Enterprise audit logs are API-only. No secret scanning management in CLI. Dependabot alerts require browser. Platform engineers need terminal access for compliance workflows.

**Commands:**

- `ghg audit-log` — query enterprise audit events with filters (actor, action, repo, date range)
- `ghg secrets scan` — scan repo history for leaked secrets (integrate with GitHub secret scanning API)
- `ghg secrets alerts` — list secret scanning alerts per repo
- `ghg dependabot list` — list Dependabot alerts with severity
- `ghg dependabot dismiss <alert-id> --reason <reason>`
- `ghg compliance check` — repo health score (license, README, CODEOWNERS, 2FA required, branch protection)

**Value:** Turns ghg into a security and compliance Swiss army knife for platform teams. This is where enterprise budget lives.
