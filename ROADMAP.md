# Ghitgud Roadmap

---

## v2.6.0 — CI/CD Developer Experience

**Why gh doesn't have it:** Issue #9125 (cache download, May 2024) and no workflow validation/dry-run support. Debugging CI failures requires browser navigation and guesswork.

**Commands:**

- `ghitgud workflow validate` — lint workflow YAML against GitHub's schema before pushing
- `ghitgud workflow dry-run` — preview job matrix, runner selection, execution path
- `ghitgud cache download <key>` — download Actions cache artifact for local debugging
- `ghitgud cache inspect <key>` — list contents of a cache without downloading
- `ghitgud run debug <run-id>` — fetch logs + annotations + failed step artifacts in one command

**Value:** Cuts CI debugging time dramatically. The validation and dry-run features prevent "push and pray" workflows.

---

## v2.7.0 — Advanced Code Review

**Why gh doesn't have it:** Issue #359 (fine-grained review, Feb 2020) — `gh pr review` only supports approve/request-changes/comment. No line-specific comments, no thread management.

**Commands:**

- `ghitgud review comment --file <path> --line <num> --body <text> --pr <num>`
- `ghitgud review threads <pr>` — list all review threads with resolution status
- `ghitgud review resolve <thread-id>` — mark a thread as resolved
- `ghitgud review suggest --file <path> --line <num> --replace <text>` — create a suggestion
- `ghitgud review apply-suggestions <pr>` — batch-apply all suggestions from a review

**Value:** Maintainers can do meaningful code review entirely from the terminal. This is the biggest missing piece of `gh`'s PR workflow.

---

## v2.8.0 — Interactive TUI Mode

**Why gh doesn't have it:** `gh` outputs flat text only. Extension `gh-dash` (very popular) proves massive demand for a rich terminal UI, but it's external and limited.

**Commands:**

- `ghitgud tui` — launch full-screen terminal UI
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

- `ghitgud milestone create --title <name> --due-date <date>`
- `ghitgud milestone list --status open|closed`
- `ghitgud milestone close <name>`
- `ghitgud milestone progress <name>` — completion percentage
- `ghitgud project board <project-id>` — ASCII kanban view in terminal
- `ghitgud issue subtasks <issue>` — list/create/link sub-tasks
- `ghitgud issue set-parent <child> --parent <parent>`

**Value:** Makes ghitgud useful for project leads and Scrum masters who track sprint progress. The ASCII kanban board is a killer demo feature.

---

## v2.10.0 — Release Automation

**Why gh doesn't have it:** `gh release create --generate-notes` exists but has no conventional commit support, no auto-versioning, no changelog templates. Teams write custom release scripts.

**Commands:**

- `ghitgud release changelog` — generate changelog from conventional commits since last tag
- `ghitgud release bump` — auto-detect next semver from commit types (feat → minor, fix → patch, BREAKING → major)
- `ghitgud release verify` — check attestation, signatures, and artifact integrity
- `ghitgud release notes --template <file>` — custom release notes template with Go-template style variables
- `ghitgud release draft --bump minor` — create draft release with auto-generated notes

**Value:** Fully automated release pipeline from terminal. Connects commits to changelog to release in one command chain.

---

## v2.11.0 — Enterprise Security & Compliance

**Why gh doesn't have it:** Enterprise audit logs are API-only. No secret scanning management in CLI. Dependabot alerts require browser. Platform engineers need terminal access for compliance workflows.

**Commands:**

- `ghitgud audit-log` — query enterprise audit events with filters (actor, action, repo, date range)
- `ghitgud secrets scan` — scan repo history for leaked secrets (integrate with GitHub secret scanning API)
- `ghitgud secrets alerts` — list secret scanning alerts per repo
- `ghitgud dependabot list` — list Dependabot alerts with severity
- `ghitgud dependabot dismiss <alert-id> --reason <reason>`
- `ghitgud compliance check` — repo health score (license, README, CODEOWNERS, 2FA required, branch protection)

**Value:** Turns ghitgud into a security and compliance Swiss army knife for platform teams. This is where enterprise budget lives.
