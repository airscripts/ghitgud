# ghitgud

[![Main](https://github.com/airscripts/ghitgud/actions/workflows/main.yml/badge.svg)](https://github.com/airscripts/ghitgud/actions/workflows/main.yml)
[![Release](https://github.com/airscripts/ghitgud/actions/workflows/release.yml/badge.svg)](https://github.com/airscripts/ghitgud/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/@airscript/ghitgud)](https://www.npmjs.com/package/@airscript/ghitgud)
[![License](https://img.shields.io/github/license/airscripts/ghitgud)](https://github.com/airscripts/ghitgud/blob/main/LICENSE)

A better GitHub CLI that extends the official gh CLI.

<p align="center">
  <img width="1280" height="640" alt="ghitgud" src="https://github.com/user-attachments/assets/e14fca4e-2efa-40fb-81da-1e5c6be9c11f" />
</p>

---

## Table of Contents

- [What It Does](#what-it-does)
- [How It Works](#how-it-works)
- [Features](#features)
- [Install](#install)
- [Configuration](#configuration)
- [Profile Management](#profile-management)
- [Commands](#commands)
- [PR Workflow](#pr-workflow)
- [Templates](#templates)
- [Output Format](#output-format)
- [Development Checks](#development-checks)
- [Repository Structure](#repository-structure)
- [Contributing](#contributing)
- [Security](#security)
- [Support](#support)
- [License](#license)

---

## What It Does

ghg is not a replacement for `gh`. It is a companion that fills the gaps in the official GitHub CLI where GitHub has chosen not to ship features that power users need daily.

The output is not a wrapper. It is a superset.

---

## How It Works

ghg layers its commands on top of the GitHub REST API and local Git operations. Each command is self-contained — it resolves configuration, validates inputs, makes the minimal necessary API calls, and returns results in human-readable form or structured JSON.

The architecture is flat and explicit:

| Layer      | Responsibility                                                |
| ---------- | ------------------------------------------------------------- |
| `cli`      | Commander program setup, global error boundary, ASCII banner  |
| `commands` | Self-registering subcommand modules with argument parsing     |
| `services` | Business logic — validation, orchestration, output formatting |
| `api`      | GitHub REST API client with auth, retry, and error mapping    |
| `core`     | Config resolution, Git helpers, file I/O, logging, errors     |
| `types`    | Shared TypeScript interfaces and normalization helpers        |

Every command reads from `src/core/config.ts`, which resolves values in this order: environment variables, active profile credentials, fallback defaults. All HTTP calls go through `src/api/client.ts` — no direct `fetch` anywhere else.

---

## Features

- **Label Management** — list, pull, push, and prune repository labels with built-in templates
- **Notifications** — list, read, and dismiss GitHub notifications from the terminal
- **Activity & Mentions** — composite views of assigned issues, review requests, and @mentions
- **PR Lifecycle** — cleanup merged branches, push back to forks, manage stacked PR chains
- **Multi-Account Profiles** — switch between GitHub accounts and tokens per repository
- **Bulk Repository Governance** — inspect, govern, label, retire, and report across repo sets
- **Repository Insights** — view traffic data, contributors, commit activity, code frequency, referrers, and participation metrics
- **Code Review** — comment on lines, list threads, resolve threads, suggest changes, and apply suggestions
- **Workflow Utilities** — validate and preview GitHub Actions workflows before pushing
- **Cache Inspection** — inspect and download GitHub Actions cache metadata
- **Run Debugging** — fetch logs, artifacts, and annotations for workflow runs
- **Proxy Passthrough** — pass any unrecognized command directly to the `gh` CLI
- **Structured JSON Output** — every command supports machine-parseable JSON via `--json`
- **Terminal Themes** — built-in dark, light, and auto color themes via `--theme`
- **Full Terminal UI** — browse and run the full `ghg` workflow surface from `ghg tui`
- **Release Automation** — generate changelogs, auto-detect next semver, verify signatures, render templated notes, and create draft releases
- **Milestone Management** — track sprint progress with create, list, close, and progress commands
- **Project Boards** — render an ASCII kanban board for any GitHub Project v2
- **Issue Subtasks** — create, link, and organize sub-issues with parent support

---

## Install

```bash
npm install -g @airscript/ghitgud
```

Published package is available at:

- npm: <https://www.npmjs.com/package/@airscript/ghitgud>
- GitHub Releases: <https://github.com/airscripts/ghitgud/releases>

For local development:

```bash
pnpm install            # Install dependencies.
pnpm build              # Build single CJS bundle with Vite.
pnpm start              # Run the CLI locally.
```

> The package installs both `ghitgud` and `ghg` commands. This documentation uses the compact `ghg` form.

---

## Configuration

Set a GitHub personal access token and repository (in `owner/repo` format):

```bash
ghg config set token <your-token>
ghg config set repo owner/repository
```

Retrieve a configured value:

```bash
ghg config get token
ghg config get repo
```

> Create a token at: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

Configuration is stored in `~/.config/ghitgud/credentials.json` and supports per-repository `.ghitgudrc` files for automatic profile detection.

---

## Profile Management

ghg introduces multi-account support through named profiles. Each profile stores its own token and optional repository association.

```bash
# Add or update a profile.
ghg profile add work --repo owner/repo --token ghp_xxx

# List all profiles.
ghg profile list

# Activate a profile for the current session.
ghg profile switch work

# Auto-detect profile from current repository.
ghg profile detect
```

When a profile is active, all API calls use that profile's token. The `detect` command reads the current repository's remote URL and matches it against profile associations, including a per-repo `.ghitgudrc` file if present.

---

## Commands

### Notifications

```bash
ghg tui                         # Launch full-screen terminal UI.
ghg notifications list          # List unread notifications.
ghg notifications read <id>     # Mark as read.
ghg notifications done <id>     # Mark as done.
```

### Activity & Mentions

```bash
ghg activity                    # Assigned issues, review requests, mentions.
ghg mentions                    # Recent @mentions of you.
```

### Labels

```bash
ghg labels list                 # List all labels.
ghg labels pull                 # Pull labels from repo to local config.
ghg labels push                 # Push local labels to repo.
ghg labels prune                # Delete all labels from repo.
```

### Repository Governance

```bash
ghg repos inspect --org airscripts
ghg repos govern --org airscripts --ruleset ./ruleset.json
ghg repos label --org airscripts -t conventional
ghg repos retire --org airscripts --months 12
ghg repos report --org airscripts --since 30d
```

- `inspect` checks for README, LICENSE, SECURITY.md, and CODEOWNERS.
- `govern` applies repository rulesets across the selected repositories.
- `label` syncs label templates or metadata across many repositories.
- `retire` finds and optionally archives inactive repositories.
- `report` summarizes repository health and velocity.

### Insights

```bash
ghg insights traffic --repo owner/repo
ghg insights contributors --repo owner/repo
ghg insights commits --repo owner/repo
ghg insights frequency --repo owner/repo
ghg insights popularity --repo owner/repo
ghg insights participation --repo owner/repo
```

### Review

```bash
ghg review comment <pr> --file src/main.ts --line 10 --body "Consider a constant here."
ghg review threads <pr>
ghg review resolve <thread-id> <pr>
ghg review suggest <pr> --file src/main.ts --line 10 --replace "const x = 1;"
ghg review apply <pr> --push
```

### Cache

```bash
ghg cache inspect <key> --repo owner/repo
ghg cache download <key> --repo owner/repo --output-dir ./cache-debug
```

### Run

```bash
ghg run debug <run-id> --repo owner/repo --output-dir ./run-debug
```

### Workflow

```bash
ghg workflow validate [path]
ghg workflow preview [path]
```

### Configuration

```bash
ghg config set <key> <val>      # Set token or repo.
ghg config get <key>            # Get configured value.
```

### Profile

```bash
ghg profile add <name>          # Add or update profile.
ghg profile list                # List all profiles.
ghg profile switch <name>       # Activate profile.
ghg profile detect              # Detect profile for current repo.
```

### Passthrough

```bash
ghg proxy <args>                # Pass any args to the gh CLI.
```

### Utility

```bash
ghg tui                         # Launch full-screen terminal UI.
ghg ping                        # Check if the CLI is working.
ghg version                     # Show version number.
```

### Milestones

```bash
ghg milestone create --title "v2.10.0" --due 2026-06-30
ghg milestone list --status open
ghg milestone close "v2.10.0"
ghg milestone progress "v2.10.0"
```

### Project Boards

```bash
ghg project board <id> --owner <owner>
```

### Issue Management

```bash
ghg issue subtasks <issue>
ghg issue subtasks <issue> --create --title "Sub-task"
ghg issue subtasks <issue> --link <sub-issue>
ghg issue parent <child> --parent <parent>
```

---

## PR Workflow

### Clean up merged branches

```bash
ghg pr cleanup                  # Delete merged branches locally and remotely.
```

### Push Back To Contributor's Fork

```bash
ghg pr push <pr-number>         # Push local changes to contributor's fork.
```

### Manage Stacked PRs

```bash
ghg pr stack create --base main
ghg pr stack list
ghg pr stack update
ghg pr stack push --title "feat: {branch}" --draft
```

### Navigate PR Chain

```bash
ghg pr next                     # Checkout next PR in chain.
```

---

## Templates

Built-in label presets are available with the `--template` / `-t` flag:

| Template       | Description                  |
| -------------- | ---------------------------- |
| `base`         | Minimal set: bug and feature |
| `conventional` | Conventional Commits labels  |
| `github`       | GitHub default labels        |

```bash
ghg labels pull -t conventional
ghg labels push -t conventional
```

---

## Output Format

By default, all commands produce human-readable terminal output. For machine-parseable results, use the `--json` flag.

```bash
ghg notifications list --json
ghg repos inspect --org airscripts --json
```

You can also control the color theme with `--theme`:

```bash
ghg ping --theme dark
ghg ping --theme light
ghg ping --theme auto
```

When `--json` is used, success responses are written to stdout and errors to stderr as structured JSON.

Success:

```json
{
  "success": true,
  "metadata": [...]
}
```

Error:

```json
{
  "success": false,
  "error": "You must set the GHITGUD_GITHUB_REPO environment variable."
}
```

---

## Development Checks

Run the canonical local checks:

```bash
pnpm typecheck          # Type check without emitting.
pnpm lint               # ESLint flat config.
pnpm format             # Prettier format.
pnpm test               # Single test run (no watch).
```

To verify formatting without rewriting files:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Optional commit-time hooks are available if you want them locally:

```bash
pnpm prepare            # Install husky hooks.
```

The pre-commit setup mirrors the lightweight formatting and lint passes. Full test runs remain part of normal local verification and CI.

---

## Repository Structure

```
src/
  cli/
    index.ts            # Entry point — Commander program setup.
    ascii.ts            # Figlet banner for help output.
  commands/
    activity.ts         # ghg activity.
    cache.ts            # ghg cache <inspect|download>.
    config.ts           # ghg config <get|set>.
    insights.ts         # ghg insights <traffic|contributors|commits|frequency|popularity|participation>.
    issue.ts            # ghg issue <subtasks|parent>.
    labels.ts           # ghg labels <list|pull|push|prune>.
    mentions.ts         # ghg mentions.
    milestone.ts        # ghg milestone <create|list|close|progress>.
    notifications.ts    # ghg notifications <list|read|done>.
    ping.ts             # ghg ping.
    pr.ts               # ghg pr <cleanup|push|next|stack>.
    profile.ts          # ghg profile <add|list|switch|detect>.
    project.ts          # ghg project <board>.
    proxy.ts            # ghg proxy <passthrough>.
    repos.ts            # ghg repos <inspect|govern|label|retire|report>.
    review.ts           # ghg review <comment|threads|resolve|suggest|apply>.
    run.ts              # ghg run <debug>.
    workflow.ts         # ghg workflow <validate|preview>.
  services/
    labels.ts           # Label business logic.
    config.ts           # Config business logic.
    profile.ts          # Profile business logic.
    pr.ts               # PR lifecycle business logic.
    stack.ts            # Stacked PR chain management.
    notifications.ts    # Notifications business logic.
    insights.ts         # Repository insights business logic.
    review.ts           # Code review business logic.
    cache.ts            # Cache inspection business logic.
    issue.ts            # Issue subtask and parent business logic.
    milestone.ts        # Milestone business logic.
    notifications.ts    # Notifications business logic.
    run.ts              # Workflow run debugging business logic.
    project.ts          # Project board business logic.
    workflow.ts         # Workflow validation and preview business logic.
    repos/
      govern.ts         # Repository rulesets.
      index.ts          # Repos services index.
      inspect.ts        # Repository governance checks.
      label.ts          # Bulk label sync.
      report.ts         # Repository health reports.
      retire.ts         # Inactive repository archival.
  api/
    client.ts           # Base HTTP client.
    commits.ts          # Commits API.
    contents.ts         # Contents API.
    insights.ts         # Insights API.
    issues.ts           # Issues API.
    milestones.ts       # Milestones API.
    projects.ts         # Projects API.
    labels.ts           # GitHub Labels API methods.
    notifications.ts    # GitHub Notifications API methods.
    pr.ts               # GitHub PR API methods.
    pulls.ts            # Pulls API.
    repos.ts            # Repositories API.
    rulesets.ts         # Rulesets API.
  core/
    command.ts          # Shared command runner.
    config.ts           # Config resolver — env vars, profiles, credentials file.
    constants.ts        # Shared constants, error messages, config keys.
    dates.ts            # Date formatting helpers.
    errors.ts           # Custom error class hierarchy.
    git.ts              # Git operations (branch detection, remote tracking).
    io.ts               # Generic file helpers.
    logger.ts           # Consola instance for rich CLI output.
    output.ts           # Terminal rendering (tables, sections, lists, key-values).
    output-state.ts     # Global output state (JSON mode tracking).
    progress.ts         # Bulk progress bars.
    prompt.ts           # Interactive prompts.
    spinner.ts          # Async loading spinners.
    theme.ts            # Color theme management.
  types/
    index.ts            # Shared type definitions.
    notifications.ts    # Notification-specific types.
templates/
  base.json             # Minimal label template.
  conventional.json     # Conventional-commits label template.
  github.json           # GitHub default label template.
tests/
  unit/                 # Unit tests mirroring src/ structure.
```

- New commands go in `src/commands/`. Each exports `{ register }` — a function that takes the Commander `program` and wires up subcommands.
- New service logic goes in `src/services/`. Services hold business logic and I/O.
- New API endpoints go in `src/api/`. API modules use the shared `client.ts` — never call `fetch` directly.
- All constants live in `src/core/constants.ts`. No magic strings or numbers elsewhere.
- All custom errors live in `src/core/errors.ts`. No bare `new Error()` for domain errors.
- `@/` import aliases are used throughout. Resolved by Vite at build time and by `tsconfig.json` paths for type checking.

---

## Contributing

Contributions and suggestions about how to improve this project are welcome!
Please follow [our contribution guidelines](https://github.com/airscripts/ghitgud/blob/main/CONTRIBUTING.md).

---

## Security

See [SECURITY.md](https://github.com/airscripts/ghitgud/blob/main/SECURITY.md) for reporting vulnerabilities.

---

## Support

If you want to support my work you can do it by following me, leaving a star, sharing my projects or also donating at the links below.
Choose what you find more suitable for you:

<a href="https://sponsor.airscript.it" target="blank">
  <img src="https://raw.githubusercontent.com/airscripts/assets/main/images/github-sponsors.svg" alt="GitHub Sponsors" width="30px" />
</a>
<a href="https://kofi.airscript.it" target="blank">
  <img src="https://raw.githubusercontent.com/airscripts/assets/main/images/kofi.svg" alt="Kofi" width="30px" />
</a>

---

## License

This repository is licensed under [MIT License](https://github.com/airscripts/ghitgud/blob/main/LICENSE).
