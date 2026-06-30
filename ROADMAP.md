# Ghitgud Roadmap

This document tracks planned features that have not yet been implemented. Entries follow a consistent format so that the transition from roadmap to implementation is unambiguous.

Each milestone entry must include:

- **ID** — A short, unique identifier (alphanumeric, e.g. `a1b2c3d4`) used to cross-reference the milestone across CHANGELOG and commits.
- **Title** — A concise, human-readable name for the feature family.
- **Why gh doesn't have it** — A one-sentence explanation of the gap this fills compared to the official `gh` CLI.
- **Commands** — Every `ghg` subcommand the milestone will add, listed with their full invocation (flags are optional but positional args and required flags must be shown).
- **Value** — A one-sentence summary of the user benefit.

Example:

```
## k8l9m0n1 — Code Search & Navigation

**Why gh doesn't have it:** `gh search` is limited to text queries. No symbol navigation, definition lookup, or PR-aware blame exists.

**Commands:**

- `ghg code search <query> --repo <repo>` — semantic code search
- `ghg code definitions <symbol>` — find symbol definitions
- `ghg code references <symbol>` — find symbol references
- `ghg code file <path> --line <num>` — view file at specific commit
- `ghg code blame <file>` — enhanced blame with PR context

**Value:** Code review and debugging stay in the terminal without switching to the browser for navigation.
```

When a milestone is fully implemented, remove its entry from this file and add the corresponding CHANGELOG entries under `[Unreleased]`.

---

## dfefc828 — Agent Task Management

**Why gh doesn't have it:** The official `gh` CLI has preview support for
agent tasks, but `ghg` does not yet provide a native equivalent or enhanced
workflow.

**Commands:**

- `ghg agent-task create [description]` — create and optionally follow an agent task
- `ghg agent-task list` — list agent tasks with human and JSON output
- `ghg agent-task view <session-or-pr>` — inspect task state, metadata, and logs

**Value:** Users can create and monitor GitHub coding-agent work without
falling back to `gh` or the browser.

## 8260c180 — Command Aliases

**Why gh doesn't have it:** The official `gh` CLI supports persistent command
aliases, while `ghg` currently requires users to maintain shell-specific
wrappers.

**Commands:**

- `ghg alias set <name> <expansion>` — create or replace an alias
- `ghg alias list` — list configured aliases
- `ghg alias delete <name>` — remove an alias
- `ghg alias import [file]` — import aliases from a file or standard input

**Value:** Repeatable shortcuts and composed workflows become portable across
shells and machines.

## 57a7d4eb — Shell Completion

**Why gh doesn't have it:** The official `gh` CLI generates completion scripts
for major shells, but `ghg` currently provides no native completion command.

**Commands:**

- `ghg completion --shell <bash|zsh|fish|powershell>` — generate a shell completion script

**Value:** Commands, options, and arguments can be discovered and completed
directly from the user's shell.

## 0139dc2e — Copilot CLI Integration

**Why gh doesn't have it:** The official `gh` CLI can launch GitHub Copilot
CLI, while `ghg` only offers generic `gh` proxying for that workflow.

**Commands:**

- `ghg copilot [args...]` — install, update, and run GitHub Copilot CLI

**Value:** AI-assisted terminal workflows remain available through the native
`ghg` command surface.

## d2b4132a — License Discovery

**Why gh doesn't have it:** The official `gh` CLI exposes GitHub's license
catalog, but `ghg` has no equivalent discovery command.

**Commands:**

- `ghg licenses` — list available open-source licenses
- `ghg repo license list` — list available repository licenses
- `ghg repo license view <key>` — view a license template

**Value:** Repository creation and governance can select and inspect licenses
without leaving the terminal.

## 63687dca — Preview Utilities

**Why gh doesn't have it:** The official `gh` CLI exposes preview utilities
for experimental UX, while `ghg` has no top-level preview family.

**Commands:**

- `ghg preview prompter [type]` — preview supported interactive prompt types

**Value:** Contributors can validate terminal prompting behavior consistently
while new interaction patterns are developed.

## 892e3d7e — Agent Skill Management

**Why gh doesn't have it:** The official `gh` CLI supports previewing,
installing, publishing, searching, and updating agent skills, but `ghg` does
not yet expose these workflows.

**Commands:**

- `ghg skill install <repository> [skill]` — install one or more agent skills
- `ghg skill list` — list installed skills across supported agent hosts
- `ghg skill preview <repository> [skill]` — inspect a skill before installation
- `ghg skill publish [path]` — validate and publish skills
- `ghg skill search [query]` — search available skills
- `ghg skill update [skill]` — update installed skills

**Value:** Agent capabilities can be managed from the same CLI used for the
repositories that contain them.

## 8980d9b2 — Native gh Behavioral Parity

**Why gh doesn't have it:** `ghg` overlaps most official `gh` command families,
but does not yet match every subcommand, flag, alias, output format, host mode,
exit behavior, and GitHub Enterprise workflow.

**Commands:**

- `ghg auth|api|browse|cache|codespace|config|discussion ...` — match official behavior and supported flags
- `ghg extension|gist|issue|labels|org|pr|project|release ...` — close remaining command-depth gaps
- `ghg repo|ruleset|run|search|secret|ssh-key|status|variable|workflow ...` — complete native compatibility

**Value:** `ghg` becomes a credible native replacement for `gh`, while its
governance, insights, security, bulk automation, stacked PR, and TUI features
continue to provide capabilities beyond parity.
