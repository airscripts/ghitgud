# ghitgud

[![Main](https://github.com/airscripts/ghitgud/actions/workflows/main.yml/badge.svg)](https://github.com/airscripts/ghitgud/actions/workflows/main.yml)
[![Release](https://github.com/airscripts/ghitgud/actions/workflows/release.yml/badge.svg)](https://github.com/airscripts/ghitgud/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/@airscript/ghitgud)](https://www.npmjs.com/package/@airscript/ghitgud)
[![License](https://img.shields.io/github/license/airscripts/ghitgud)](https://github.com/airscripts/ghitgud/blob/main/LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-89%25-brightgreen)](./coverage)

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
- [Playbooks](#playbooks)
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

| Layer      | Responsibility                                                                               |
| ---------- | -------------------------------------------------------------------------------------------- |
| `cli`      | Commander program setup, global error boundary, ASCII banner                                 |
| `commands` | Self-registering subcommand modules with argument parsing                                    |
| `services` | Business logic — validation, orchestration, output formatting                                |
| `api`      | GitHub REST API client with auth, retry, and error mapping                                   |
| `core`     | Config resolution, Git helpers, file I/O, logging, errors                                    |
| `types`    | Shared TypeScript interfaces and normalization helpers                                       |
| `tui`      | Full-screen terminal UI runtime, layout engine, renderer, and interactive command operations |

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
- **Security & Compliance** — audit enterprise and organization activity, scan repositories for leaked secrets, triage Dependabot and secret scanning alerts, and run compliance checks across repository hygiene, branch protection, and rulesets
- **GitHub Discussions** — list, view, create, comment on, close, and manage discussion categories entirely from the terminal
- **Variables & Environments** — list, set, and delete repository, environment, and organization variables; create environments and manage protection rules
- **Secrets** — list, set, and delete encrypted repository, environment, and organization secrets with libsodium public-key encryption
- **Organization & Team Management** — list organization members, invite and remove users, manage teams and team membership, invite collaborators and grant team access to repositories
- **GitHub Pages & Wiki** — configure and deploy branch-based Pages sites, inspect build status, and manage wiki pages from the terminal

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

Set a GitHub personal access token:

```bash
ghg config set token <your-token>
```

Retrieve a configured value:

```bash
ghg config get token
```

Configuration is stored in `~/.config/ghitgud/credentials.json`.

### Token Scopes

Use a **classic personal access token** (PAT). Fine-grained PATs are repository-scoped and will fail with 403 errors on user-scoped endpoints such as notifications, activity, and mentions.

Create a token at: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

#### Required Scopes

These scopes are needed for core functionality:

| Scope           | Why                                              |
| --------------- | ------------------------------------------------ |
| `repo`          | Full repository access (issues, PRs, code, wiki) |
| `read:org`      | List org members, teams, audit logs              |
| `read:user`     | Activity feed, profile detection                 |
| `notifications` | List, read, and dismiss notifications            |

#### Optional Scopes

Some commands require additional scopes. Add these only if you use the corresponding features:

| Scope              | Commands                                                     |
| ------------------ | ------------------------------------------------------------ |
| `admin:org`        | `org invite`, `org remove`, `team create`, `team add/remove` |
| `read:project`     | `project board`                                              |
| `delete_repo`      | `repos retire` (archives and deletes)                        |
| `admin:public_key` | Included in some token defaults; not directly used by ghg    |

### Non-Interactive Mode (CI)

When running in CI pipelines or other non-interactive contexts, set the `CI` environment variable:

```bash
CI=true ghg team list --org myorg
```

In non-interactive mode, commands that normally prompt for missing required arguments (such as org name, team name, username) will throw an error instead of opening an interactive prompt. This ensures commands fail fast with clear messages in automation.

You can also use `--json` mode, which implies non-interactive behavior:

```bash
ghg team list --org myorg --json
```

### Repository Target Resolution

For commands that need a repository, ghg resolves the target from the `--repo` flag or the current git remote. If neither is available, the command throws an error.

### Wiki Initialization

Wiki commands (`ghg wiki list`, `ghg wiki view`, `ghg wiki create`, `ghg wiki edit`, `ghg wiki delete`) require the repository's wiki to be initialized first. If the wiki has never been used, you will see:

```
ERROR  The wiki does not exist or has not been initialized for this repository.
```

To initialize a wiki, visit `https://github.com/<owner>/<repo>/wiki` and click "Create the first page", or push a `Home.md` file to the wiki Git endpoint:

```bash
git clone https://github.com/<owner>/<repo>.wiki.git /tmp/wiki-init
cd /tmp/wiki-init
echo "# Home" > Home.md
git add Home.md && git commit -m "Initialize wiki"
git push
```

---

## Profile Management

ghg introduces multi-account support through named profiles. Each profile stores its own token.

```bash
# Add or update a profile.
ghg profile add work --token ghp_xxx

# List all profiles.
ghg profile list

# Activate a profile for the current session.
ghg profile switch work

# Auto-detect profile from current repository.
ghg profile detect
```

When a profile is active, all API calls use that profile's token. The `detect` command reads the current repository's remote URL and matches it against profile associations.

---

## Commands

### Notifications

```bash
ghg tui
ghg notifications list
ghg notifications read <id>
ghg notifications done <id>
```

- `tui` launches the full-screen terminal UI.
- `list` lists unread notifications.
- `read` marks a notification as read.
- `done` marks a notification as done.

### Activity & Mentions

```bash
ghg activity
ghg mentions
```

- `activity` shows assigned issues, review requests, and mentions.
- `mentions` shows recent @mentions of you.

### Labels

```bash
ghg labels list
ghg labels pull
ghg labels push
ghg labels prune
```

- `list` lists all repository labels.
- `pull` pulls labels from the repository to local config.
- `push` pushes local labels to the repository.
- `prune` deletes all labels from the repository.

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

- `traffic` shows repository traffic data.
- `contributors` shows top contributors.
- `commits` shows commit activity.
- `frequency` shows code frequency.
- `popularity` shows referrers and popular paths.
- `participation` shows participation stats.

### Review

```bash
ghg review comment <pr> --file src/main.ts --line 10 --body "Consider a constant here."
ghg review threads <pr>
ghg review resolve <thread-id> <pr>
ghg review suggest <pr> --file src/main.ts --line 10 --replace "const x = 1;"
ghg review apply <pr> --push
```

- `comment` creates a line review comment.
- `threads` lists review threads for a pull request.
- `resolve` marks a review thread as resolved.
- `suggest` creates a single-line suggestion.
- `apply` applies review suggestions locally.

### Cache

```bash
ghg cache inspect <key> --repo owner/repo
ghg cache download <key> --repo owner/repo --output-dir ./cache-debug
```

- `inspect` inspects GitHub Actions cache metadata.
- `download` downloads cache-related debug artifacts.

### Run

```bash
ghg run debug <run-id> --repo owner/repo --output-dir ./run-debug
```

- `debug` fetches logs, artifacts, and annotations for a workflow run.

### Workflow

```bash
ghg workflow validate [path]
ghg workflow preview [path]
```

- `validate` validates GitHub Actions workflow files.
- `preview` previews workflow structure.

### Configuration

```bash
ghg config set <key> <val>
ghg config get <key>
```

- `set` sets a config value such as token.
- `get` reads a configured value.

### Profile

```bash
ghg profile add <name>
ghg profile list
ghg profile switch <name>
ghg profile detect
```

- `add` adds or updates a profile.
- `list` lists all profiles.
- `switch` activates a profile.
- `detect` detects the profile for the current repository.

### Passthrough

```bash
ghg proxy <args>
```

- `proxy` passes any arguments through to the official `gh` CLI.

### Utility

```bash
ghg tui
ghg ping
ghg version
```

- `tui` launches the full-screen terminal UI.
- `ping` checks if the CLI is working.
- `version` shows the current version number.

### Milestones

```bash
ghg milestone create --title "v2.10.0" --due 2026-06-30
ghg milestone list --status open
ghg milestone close "v2.10.0"
ghg milestone progress "v2.10.0"
```

- `create` creates a repository milestone with a due date.
- `list` lists open or closed milestones.
- `close` closes a milestone by title.
- `progress` shows milestone completion percentage.

### Project Boards

```bash
ghg project board <id> --owner <owner>
```

- `board` renders an ASCII kanban board for a GitHub Project v2.

### Issue Management

```bash
ghg issue subtasks <issue>
ghg issue subtasks <issue> --create --title "Sub-task"
ghg issue subtasks <issue> --link <sub-issue>
ghg issue parent <child> --parent <parent>
```

- `subtasks` lists sub-issues for a parent issue.
- `subtasks --create` creates and links a new sub-issue.
- `subtasks --link` links an existing issue as a sub-issue.
- `parent` links an existing issue to a parent issue.

### Security & Compliance

```bash
ghg audit --org <org>
ghg audit --enterprise <slug> --actor <actor> --action <action>
ghg compliance check --org <org>
ghg dependabot list --org <org> --severity critical
ghg dependabot dismiss <alert> --repo owner/repo --reason fix_started --yes
ghg leaks scan --limit 50
ghg leaks alerts --org <org> --state open
```

- `audit` queries organization or enterprise audit logs.
- `compliance check` scores repository compliance posture.
- `dependabot list` inspects Dependabot alerts.
- `dependabot dismiss` dismisses a Dependabot alert.
- `leaks scan` runs a local scan for leaked secrets.
- `leaks alerts` lists secret scanning alerts.

### Discussions

```bash
ghg discussion list
ghg discussion list --category "Q&A"
ghg discussion view <number>
ghg discussion create --title "Hello" --category "General" --body "Text"
ghg discussion comment <number> --body "Nice post!"
ghg discussion close <number>
ghg discussion categories
```

- `list` lists discussions, optionally by category.
- `view` views a discussion and its comments.
- `create` creates a new discussion.
- `comment` adds a comment to a discussion.
- `close` closes a discussion.
- `categories` lists available discussion categories.

### Variables

```bash
ghg variable list
ghg variable list --env <name>
ghg variable list --org <org>
ghg variable set --name <key> --value <val>
ghg variable set --name <key> --value <val> --env <name>
ghg variable set --name <key> --value <val> --org <org>
ghg variable delete --name <key>
```

- `list` lists repository, environment, or organization variables.
- `set` creates or updates a variable.
- `delete` removes a variable.

### Environments

```bash
ghg environment list
ghg environment create --name <name> [--wait-timer <seconds>]
ghg environment protection list --env <name>
ghg environment protection add --env <name> --type <type> --value <json>
ghg environment protection remove --env <name> --rule-id <id>
```

- `list` lists configured environments.
- `create` creates an environment with an optional wait timer.
- `protection list` lists protection rules for an environment.
- `protection add` adds a protection rule.
- `protection remove` removes a protection rule.

### Secrets

```bash
ghg secret list
ghg secret list --env <name>
ghg secret list --org <org>
ghg secret set --name <key> --value <val>
ghg secret set --name <key> --value <val> --env <name>
ghg secret set --name <key> --value <val> --org <org>
ghg secret delete --name <key>
```

- `list` lists repository, environment, or organization secrets.
- `set` creates or updates an encrypted secret.
- `delete` removes a secret.

### GitHub Pages

```bash
ghg pages status
ghg pages deploy --source main
ghg pages deploy --source main --path /docs
ghg pages deploy --source main --build-type workflow
ghg pages unpublish --yes
```

- `status` shows the Pages configuration and latest build.
- `deploy` creates or updates a branch source and requests a build. Use `--build-type` to select `legacy` (default) or `workflow` (GitHub Actions).
- `unpublish` removes the Pages site after confirmation.

### Wiki

```bash
ghg wiki list
ghg wiki view Home
ghg wiki edit "Getting Started" --file ./getting-started.md
ghg wiki create FAQ --file ./faq.md
ghg wiki delete OldPage
```

- `list` lists wiki pages and their source formats.
- `view` prints a page's source.
- `edit` replaces, commits, and publishes an existing page.
- `create` commits and publishes a new page.
- `delete` removes a wiki page permanently.

### Organization

```bash
ghg org members --org airscripts
ghg org invite --org airscripts --user octocat --role admin
ghg org remove --org airscripts --user octocat
```

- `members` lists all organization members with their roles.
- `invite` adds or updates a user's organization membership.
- `remove` removes a user from the organization.

### Team

```bash
ghg team list --org airscripts
ghg team create --org airscripts --name ops --description "Platform team"
ghg team add --org airscripts --team ops --user octocat --role maintainer
ghg team remove --org airscripts --team ops --user octocat
```

- `list` shows all teams in an organization.
- `create` creates a new team.
- `add` adds a member to a team.
- `remove` removes a member from a team.

### Repository Access

```bash
ghg repo invite --user octocat --role push
ghg repo grant --team ops --role admin
```

- `invite` invites a collaborator to a repository.
- `grant` grants team access to a repository.

---

## PR Workflow

### Clean up merged branches

```bash
ghg pr cleanup
```

- `cleanup` deletes merged branches locally and remotely.

### Push Back To Contributor's Fork

```bash
ghg pr push <pr-number>
```

- `push` pushes local changes to a contributor's fork.

### Manage Stacked PRs

```bash
ghg pr stack create --base main
ghg pr stack list
ghg pr stack update
ghg pr stack push --title "feat: {branch}" --draft
```

- `stack create` creates a stack from the current branch.
- `stack list` shows the current stack status.
- `stack update` updates an existing stack after parent PR merges.
- `stack push` pushes a stack and creates or updates PRs.

### Navigate PR Chain

```bash
ghg pr next
```

- `next` checks out the next PR in the chain.

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

For debugging, use `--debug` to write a trace log to a temporary file:

```bash
ghg notifications list --debug
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
  "error": "No repository specified. Use --repo owner/repo or run inside a git repository with a GitHub remote."
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
    audit.ts            # ghg audit.
    cache.ts            # ghg cache <inspect|download>.
    compliance.ts       # ghg compliance <check>.
    config.ts           # ghg config <get|set>.
    dependabot.ts       # ghg dependabot <list|dismiss>.
    discussion.ts       # ghg discussion <list|view|create|comment|close|categories>.
    insights.ts         # ghg insights <traffic|contributors|commits|frequency|popularity|participation>.
    issue.ts            # ghg issue <subtasks|parent>.
    labels.ts           # ghg labels <list|pull|push|prune>.
    leaks.ts            # ghg leaks <scan|alerts>.
    org.ts              # ghg org <members|invite|remove>.
    team.ts             # ghg team <list|create|add|remove>.
    repo.ts             # ghg repo <invite|grant>.
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
    secrets.ts          # ghg secret <list|set|delete>.
    variable.ts         # ghg variable <list|set|delete>.
    environment.ts      # ghg environment <list|create|protection>.
    pages.ts            # ghg pages <status|deploy|unpublish>.
    wiki.ts             # ghg wiki <list|view|edit|create|delete>.
    workflow.ts         # ghg workflow <validate|preview>.
  services/
    labels.ts           # Label business logic.
    config.ts           # Config business logic.
    profile.ts          # Profile business logic.
    pr.ts               # PR lifecycle business logic.
    stack.ts            # Stacked PR chain management.
    notifications.ts    # Notifications business logic.
    insights.ts           # Repository insights business logic.
    org.ts              # Organization membership business logic.
    team.ts             # Team management business logic.
    invites.ts          # Repository invite and team grant business logic.
    review.ts           # Code review business logic.
    cache.ts            # Cache inspection business logic.
    issue.ts            # Issue subtask and parent business logic.
    milestone.ts        # Milestone business logic.
    notifications.ts    # Notifications business logic.
    run.ts              # Workflow run debugging business logic.
    project.ts          # Project board business logic.
    workflow.ts         # Workflow validation and preview business logic.
    secrets.ts          # Repository, environment, and organization secrets business logic.
    variables.ts        # Repository, environment, and organization variables business logic.
    environments.ts     # Environment and protection rules business logic.
    pages.ts            # GitHub Pages configuration and deployment logic.
    wiki.ts             # Wiki clone, read, commit, and publish logic.
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
    orgs.ts             # Organization membership API.
    teams.ts            # Team management API.
    invites.ts          # Repository invite and team grant API.
    leaks.ts            # Secret scanning alerts API.
    secrets.ts          # Repository, environment, and organization secrets API.
    variables.ts        # Repository, environment, and organization variables API.
    environments.ts     # Environment and protection rules API.
        pages.ts            # GitHub Pages API.

  core/
    command.ts          # Shared command runner.
    repo.ts             # Repository target resolution from git remotes.
    config.ts           # Config resolver — env vars, profiles, credentials file.
    constants.ts        # Shared constants, error messages, config keys.
    dates.ts            # Date formatting helpers.
    errors.ts           # Custom error class hierarchy.
    git.ts              # Git operations (branch detection, remote tracking).
    wiki-git.ts         # Authenticated temporary wiki Git operations.
    io.ts               # Generic file helpers.
    logger.ts           # Consola instance with debug logging support.
    output.ts           # Terminal rendering (tables, sections, lists, key-values).
    output-state.ts     # Global output state (JSON and debug mode tracking).
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

## Playbooks

Playbooks are shell scripts that run `ghg` against the live GitHub API to verify the CLI works end to end. Each playbook covers one command family, tests positive and negative cases, and reverts all mutations on exit.

### Setup

```bash
export GHG_TOKEN=ghp_...
export REPO=airscripts/chore    # Default repo for repo-scoped commands.
export ORG=airchive             # Default org for org-scoped commands.
```

Change `REPO` and `ORG` in `playbooks/env.sh` or override them with environment variables.

#### Prerequisites

- **Node.js >= 24** and **pnpm >= 10** for building from source.
- **GitHub CLI (`gh`)** is required for some playbooks that create or clean up test resources (issues, teams, environments, wiki initialization). Install it from https://cli.github.com and run `gh auth login`.
- **Python 3** is required by some playbook teardown helpers for parsing JSON output.
- **Git** is required for wiki operations (`ghg wiki create`, `ghg wiki edit`, `ghg wiki delete`).

#### Wiki Prerequisite

The wiki playbooks require the repository's wiki to be initialized. If the wiki has never been used, visit `https://github.com/<owner>/<repo>/wiki` and create the first page, or push a `Home.md` to the wiki Git endpoint (see [Wiki Initialization](#wiki-initialization) under Configuration).

#### Optional Environment Variables

Some playbooks require additional context that cannot be created automatically:

| Variable      | Playbooks    | What to Set                                                      |
| ------------- | ------------ | ---------------------------------------------------------------- |
| `REVIEW_PR`   | `review.sh`  | An open pull request number on the test repo                     |
| `PROJECT_ID`  | `project.sh` | A GitHub Project v2 number (requires `read:project` token scope) |
| `RUN_ID`      | `run.sh`     | An existing workflow run ID on the test repo                     |
| `INVITE_USER` | `org.sh`     | A GitHub username to invite (defaults to `github-actions[bot]`)  |

If these variables are not set, the corresponding test steps are skipped automatically.

### Run a Playbook

```bash
bash playbooks/pages.sh
bash playbooks/wiki.sh
bash playbooks/config.sh
```

### Run All Playbooks

```bash
bash playbooks/all.sh
```

- `SKIP="run.sh,project.sh"` skips specific playbooks.
- `PARALLEL=1` runs playbooks concurrently (teardown order is not guaranteed).

### Coverage

- `ping.sh` — `ghg ping`
- `config.sh` — `ghg config set/get/unset`
- `profile.sh` — `ghg profile detect/list/add/switch`
- `activity.sh` — `ghg activity`
- `mentions.sh` — `ghg mentions`
- `cache.sh` — `ghg cache inspect/download`
- `insights.sh` — `ghg insights traffic/contributors/commits/frequency/popularity/participation`
- `notifications.sh` — `ghg notifications list/read/done`
- `dependabot.sh` — `ghg dependabot list/dismiss`
- `leaks.sh` — `ghg leaks alerts`
- `audit.sh` — `ghg audit`
- `compliance.sh` — `ghg compliance check`
- `workflow.sh` — `ghg workflow validate/preview`
- `labels.sh` — `ghg labels list/pull/push/prune`
- `pages.sh` — `ghg pages status/deploy/unpublish`
- `wiki.sh` — `ghg wiki list/view/edit/create/delete`
- `environment.sh` — `ghg environment list/create`
- `variable.sh` — `ghg variable list/set/delete`
- `secret.sh` — `ghg secret list/set/delete`
- `milestone.sh` — `ghg milestone create/list/close/progress`
- `discussion.sh` — `ghg discussion list/view/create/comment/close/categories`
- `org.sh` — `ghg org members/invite/remove`
- `team.sh` — `ghg team list/create/add/remove`
- `issue.sh` — `ghg issue subtasks/parent`
- `review.sh` — `ghg review comment/threads/resolve/suggest/apply`
- `repos.sh` — `ghg repos inspect/govern/label/retire/report/clone`
- `repo.sh` — `ghg repo invite/grant`
- `release.sh` — `ghg release changelog/bump/verify/notes/draft`
- `pr.sh` — `ghg pr cleanup/push/next/stack`
- `project.sh` — `ghg project board`
- `run.sh` — `ghg run debug`

### Conventions

- Every playbook sources `playbooks/env.sh` for configuration and assertion helpers.
- Each playbook defines `setup()` and `teardown()` with `trap teardown EXIT` to guarantee cleanup.
- Test resources are prefixed with `ghg-test-` or `ghg_` for easy identification.
- Non-reversible resources (environments, open PRs) are moved to a closed terminal state with a `[noop]` title.
- The `config.sh` playbook never modifies the `token` key — it uses a dedicated `ghg_playbook_test_key`.
- Set `REVIEW_PR`, `PROJECT_ID`, or `RUN_ID` to enable playbooks that require specific resource IDs.

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
