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

ghg layers its commands on top of the GitHub REST API and local Git operations. Each command is self-contained — it resolves configuration, validates inputs, makes the minimal necessary API calls, and returns structured JSON.

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
- **gh Passthrough** — proxy any unrecognized command directly to the `gh` CLI
- **Structured JSON Output** — every command returns machine-parseable JSON

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
ghg repos report --org airscripts --since 30d
```

- `inspect` checks for README, LICENSE, SECURITY.md, and CODEOWNERS.
- `govern` applies repository rulesets across the selected repositories.
- `label` syncs label templates or metadata across many repositories.
- `retire` finds and optionally archives inactive repositories.
- `report` summarizes repository health and velocity.

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
ghg gh <args>                   # Proxy any args to the gh CLI.
```

### Utility

```bash
ghg ping                        # Check if the CLI is working.
```

---

## PR Workflow

### Clean up merged branches

```bash
ghg pr cleanup                  # Delete merged branches locally and remotely.
```

### Push back to contributor's fork

```bash
ghg pr push <pr-number>         # Push local changes to contributor's fork.
```

### Manage stacked PRs

```bash
ghg pr stack init --base main
ghg pr stack add feature-part-2 --depends-on feature-part-1
```

### Navigate PR chain

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

All commands output JSON to stdout on success and JSON to stderr on failure.

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
pnpm test -- --run      # Single test run (no watch).
```

To verify formatting without rewriting files:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test -- --run
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
    ping.ts             # ghg ping.
    labels.ts           # ghg labels <list|pull|push|prune>.
    config.ts           # ghg config <get|set>.
    profile.ts          # ghg profile <add|list|switch|detect>.
    pr.ts               # ghg pr <cleanup|push|stack|next>.
    notifications.ts    # ghg notifications <list|read|done>.
    activity.ts         # ghg activity.
    mentions.ts         # ghg mentions.
    gh.ts               # ghg gh <passthrough>.
  services/
    labels.ts           # Label business logic.
    config.ts           # Config business logic.
    profile.ts          # Profile business logic.
    pr.ts               # PR lifecycle business logic.
    stack.ts            # Stacked PR chain management.
    notifications.ts    # Notifications business logic.
  api/
    client.ts           # Base HTTP client.
    labels.ts           # GitHub Labels API methods.
    pr.ts               # GitHub PR API methods.
    notifications.ts    # GitHub Notifications API methods.
  core/
    constants.ts        # Shared constants, error messages, config keys.
    errors.ts           # Custom error class hierarchy.
    config.ts           # Config resolver — env vars, profiles, credentials file.
    git.ts              # Git operations (branch detection, remote tracking).
    io.ts               # Generic file helpers.
    logger.ts           # Consola instance for rich CLI output.
  types/
    index.ts            # Shared type definitions.
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
