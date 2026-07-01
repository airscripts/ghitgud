# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Command aliases: `ghg alias set`, `list`, `delete`, `import` for persistent command shortcuts portable across shells
- Shell completion: `ghg completion generate --shell <bash|zsh|fish|powershell>` and `ghg completion list` for shell completion scripts
- Preview utilities: `ghg preview prompter [type]` for interactive prompt type previews
- License discovery: `ghg licenses list`, `ghg licenses view <key>`, `ghg repo license list --repo <repo>` for license catalog inspection
- Copilot CLI integration: `ghg copilot [args...]` to detect and run GitHub Copilot CLI
- Agent task management: `ghg agent-task create [description]`, `list`, `view <session-or-pr>` for creating and monitoring GitHub agent tasks
- Agent skill management: `ghg skill install <repository> [skill]`, `list`, `preview <repository> [skill]`, `publish [path]`, `search [query]`, `update [skill]` for managing agent capabilities
- Auth status `--show-token` flag to display the full token inline
- Auth setup-git command to configure git credential helper for HTTPS authentication
- Issue close and reopen `--comment` flag for adding a comment when changing issue state
- PR close and reopen `--comment` flag for adding a comment when changing pull request state
- Config keys are now functional with supported keys: editor, pager, prefer_editor, prompt, git_protocol, browser
- Code search and navigation: `ghg code search`, `definitions`, `references`, `file`, `blame` for symbol navigation and enhanced blame with PR context
- Template discovery: `ghg template list`, `show` for issue and PR template inspection
- Label bulk and sync: `ghg label bulk --file <path>` for creating labels from JSON/YAML, `ghg label sync --source <repo>` for syncing labels from another repository
- Package and container registry: `ghg package list`, `view`, `versions`, `delete`, `restore` for managing GHCR and package versions
- Self-hosted runner management: `ghg runner list`, `view`, `status`, `remove`, `labels` for repo and org runner lifecycle
- Advisory lifecycle commands: `ghg advisory create`, `publish`, `close`, `cve-request` for repo-scoped security advisory management, plus `--repo` and `--state` filters on `list` and `view`
- Extension management: `ghg extension list`, `install`, `remove`, `upgrade`, `create` for locally installed CLI extensions
- Codespace management: `ghg codespace list`, `view`, `create`, `start`, `stop`, `delete` for GitHub Codespaces lifecycle
- Browser integration: `ghg browse repo`, `issues`, `pulls`, `actions`, `settings`, `releases`, `pr` to open pages in the browser
- Artifact attestation: `ghg attestation list`, `verify` for provenance and SLSA verification
- SSH key management: `ghg ssh-key list`, `add`, `delete` for user SSH key lifecycle
- GPG key management: `ghg gpg-key list`, `add`, `delete` for user GPG key lifecycle
- Self-hosted runner management: `ghg runner list`, `view`, `status`, `remove`, `labels` for repo and org runner lifecycle
- Advisory lifecycle commands: `ghg advisory create`, `publish`, `close`, `cve-request` for repo-scoped security advisory management, plus `--repo` and `--state` filters on `list` and `view`
- TUI workspace operations for Code Navigation, Templates, Packages, Runners, and extended Advisories
- Playbook coverage for code, template, package, runner, and advisory commands
- Gist fork, star, unstar, and comment commands: `ghg gist fork`, `star`, `unstar`, `comment`
- Reaction commands: `ghg react list`, `add`, `remove` for emoji reactions on issues, comments, and PR review comments
- Comment thread management: `ghg comment list`, `reply`, `delete` for issue and PR comment threads
- Dependency graph commands: `ghg deps list`, `direct`, `review` for repository dependency inspection and comparison
- Advisory database commands: `ghg advisory list`, `view` for querying the GitHub Advisory Database
- CodeQL alert management: `ghg codeql list`, `view`, `dismiss` for code scanning alert lifecycle
- Workspace and multi-repo operations: `ghg workspace define`, `list`, `run`, `ghg repo syncall`, `ghg repo statusall`, `ghg branch stale`, `ghg branch sweep`
- Actions cost and usage analytics: `ghg actions usage`, `cost`, `top-spenders`, `export` for billing and usage visibility
- TUI workspace operations for Reactions, Comments, Dependencies, Advisories, CodeQL, Workspaces, and Actions
- Playbook coverage for gist extensions, reactions, comments, dependencies, advisories, CodeQL, workspace, and actions commands
- Workflow lifecycle commands: `ghg workflow list`, `view`, `run`, `enable`, `disable` with TUI operations and playbook coverage
- Cache list and delete commands: `ghg cache list`, `ghg cache delete` with TUI operations and playbook coverage
- Gist CRUD commands: `ghg gist list`, `view`, `create`, `edit`, `delete`, `clone` with TUI operations and playbook coverage
- Project CRUD commands: `ghg project list`, `view`, `create`, `edit`, `close`, `delete`, `item-list`, `item-add`, `item-create`, `field-list`, `link`, `unlink` with TUI operations and playbook coverage
- Ruleset CRUD commands: `ghg ruleset list`, `view`, `check`, `create`, `edit`, `delete`, `validate` with TUI operations and playbook coverage
- Cross-repository status command: `ghg status` with TUI operations and playbook coverage
- API passthrough command: `ghg api` with pagination, jq filtering, and method support
- Merge queue management: `ghg queue list`, `status`, `add`, `remove`, `history` with TUI operations and playbook coverage
- Issue type listing: `ghg issue type list` to enumerate available issue types per repository
- Webhook management: `ghg webhook list`, `create`, `edit`, `delete`, `test`, `delivery list`, `delivery view`, `delivery redeliver` for repository and organization webhooks
- Fork management: `ghg fork sync`, `compare`, `list`, `create` for repository fork operations
- Deployment tracking: `ghg deployment list`, `view`, `create`, `status`, `status-create` for deployment lifecycle management
- Actions live log streaming: `ghg run watch` with `--tail`, `--filter`, and `--follow` flags for workflow run log streaming
- Branch and tag protection: `ghg branch protect`, `unprotect`, `protection`, `tag-protect`, `tag-unprotect` for branch and tag protection management
- TUI workspace operations for Webhooks, Forks, Deployments, and Branches
- Playbook coverage for issue types, webhook, fork, deployment, and branch protection commands
- Workflow run lifecycle management with filtering, inspection, cancellation, reruns, deletion, watching, and artifact downloads
- Repository CRUD commands for create, list, view, clone, delete, archive, unarchive, rename, star, unstar, edit, fork, and local branch sync
- Repository CRUD operations in the TUI workspace and expanded live repository playbook coverage
- Search command family: `ghg search issues`, `ghg search prs`, `ghg search repos`, `ghg search code`, `ghg search commits` with `--repo`, `--state`, `--sort`, `--order`, `--limit`, `--language`, and `--author` flags
- Search workspace in the TUI with operations for issues, pull requests, repositories, code, and commits
- `getSearchPaginated` client method for GitHub Search API pagination with `total_count`, `incomplete_results`, and `items` envelope handling
- Shared `SearchResult<T>` type and normalizer functions for search item types in `src/types/search.ts`
- Playbook for search commands (`playbooks/search.sh`)
- Label CRUD commands: `ghg labels add`, `ghg labels get`, `ghg labels edit`, `ghg labels remove`, and `ghg labels clone` for individual label management
- Label CRUD operations in the TUI workspace
- Complete issue lifecycle commands for creating, listing, viewing, editing, closing, reopening, commenting, deleting, locking, pinning, transferring, and showing assigned, created, or mentioned issue status
- Issue type support plus repeatable label and assignee options for issue creation and filtering
- Full issue lifecycle operations in the TUI and expanded live issue playbook coverage
- Complete pull request lifecycle commands for CRUD, merging, checkout, diffs, checks, comments, conversation locks, draft readiness, and cross-repository status
- Pull request lifecycle operations in the TUI with an isolated live PR playbook covering reversible and disposable-branch workflows
- Authentication command family: `ghg auth login`, `logout`, `status`, `token`, `list`, `switch`, and `detect`
- Token validation on login with user info and scope display
- Masked token output by default with `--raw` flag for scripting
- Auth status showing authenticated user, name, scopes, and active profile
- Auth workspace in the TUI with login, status, list, switch, detect, and token operations

### Changed

- GitHub REST API version updated to `2026-03-10` for current issue type support
- Pull request creation now infers the repository default base branch and current local head branch when omitted
- Merged `ghg profile add/list/switch/detect` into `ghg auth login/list/switch/detect`
- Merged `ghg config set/get/unset token` into `ghg auth login/token/logout`
- Removed `ghg profile` command (replaced by `ghg auth`)
- `ghg config set/get/unset` no longer manages `token` (use `ghg auth login` instead)
- Error messages now reference `ghg auth login` instead of `ghg config set token`
- TUI workspace renamed from "Profile" to "Auth"
- TUI status bar label renamed from "profile" to "auth"

### Removed

- `ghg profile add` command (replaced by `ghg auth login`)
- `ghg profile list` command (replaced by `ghg auth list`)
- `ghg profile switch` command (replaced by `ghg auth switch`)
- `ghg profile detect` command (replaced by `ghg auth detect`)
- `ghg config set token` command (replaced by `ghg auth login --token`)
- `ghg config get token` command (replaced by `ghg auth token`)
- `ghg config unset token` command (replaced by `ghg auth logout`)

## [2.15.0] - 2026-06-28

### Added

- GitHub Pages commands: `ghg pages status`, `ghg pages deploy`, `ghg pages unpublish`
- Wiki commands: `ghg wiki list`, `ghg wiki view`, `ghg wiki edit`, `ghg wiki create`, `ghg wiki delete`
- Non-interactive mode (CI): commands throw `GhitgudError` instead of prompting when `CI=true` or `--json` is set
- Missing argument validation for org, team, profile, cache, compliance, leaks, notifications, repo, review, and run commands
- YAML syntax validation in `ghg workflow validate` using `js-yaml`
- Playbooks for all command families under `playbooks/` with `all.sh` orchestrator
- TUI workspace operations for Pages and Wiki
- `ghg wiki delete` removes a wiki page permanently via git operations

### Fixed

- `listProtectionRules` in environments service now handles non-array API responses with `Array.isArray` guard
- Wiki service uses `ora` spinner instead of consola logger to prevent duplicate output during long git clone operations
- Playbook wiki backup uses `--json` extraction to avoid capturing spinner artifacts in restored content

### Changed

- Profile, cache, compliance, leaks, notifications, org, team, repo, review, and run commands reject blank or missing required arguments in non-interactive mode

## [2.14.3] - 2026-06-25

### Added

- Debug logging capabilities with `--debug` flag for verbose output and enhanced logger functionality

### Changed

- Repository targets are now resolved from git remotes by default, removing the need to pass `--repo` when inside a git repository
- Updated dependencies: vitest 3.2.6, vite 8.1.0, @clack/prompts 1.6.0, @types/node 24.13.2, typescript-eslint monorepo, date-fns 4.4.0, dotenv 16.6.1, figlet 1.11.0, typescript 5.9.3, prettier 3.8.4, eslint 10.5.0, actions/checkout v7, github artifact actions

## [2.14.2] - 2026-06-07

### Fixed

- `fatal: not a git repository` error no longer leaks outside the TUI frame when opened outside a git repository
- Internal git helper (`src/core/git.ts`) now pipes stderr by default, preventing terminal clutter from background git failures

### Changed

- TUI output panel now shows a yellow warning message when opened outside a git repository
- TUI `resetForOperation` preserves the repo-aware default result message instead of unconditionally resetting to the generic placeholder

## [2.14.1] - 2026-06-07

### Fixed

- TUI input field alignment: removed `[insert]` prefix in favor of a single-character `>` marker with a blinking `|` cursor appended after the value
- TUI insert mode now clears the field content on entry and restores the placeholder when exiting with empty input
- TUI `buildContextLines` and renderer now treat insert mode as raw-value editing while keeping placeholder fallback in normal mode

### Added

- TUI visual mode for output selection and copying with vim-like navigation and `y` to yank selected lines
- TUI clipboard support with cross-platform copy (macOS, Windows, WSL, and Linux with `xclip`/`wl-copy` fallbacks)
- Full TUI CRUD operations for Organization workspace (`list`, `members`, `invite`, `remove`)
- Full TUI CRUD operations for Team workspace (`list`, `create`, `add`, `remove`)
- Full TUI CRUD operations for Repository Access workspace (`invite`, `grant`)
- `.prettierignore` to exclude generated and third-party files from formatting
- Expanded tests for TUI visual mode, clipboard helper, and new workspace operations

## [2.14.0] - 2026-06-07

### Fixed

- `withProgress`/`runBulk` result misalignment — fixed-size arrays indexed by position so failures map to the correct repo name
- `labels prune` now requires `--yes` flag and supports `--dry-run` to prevent accidental label deletion
- `tui` command throws `GhitgudError` instead of calling `process.exit(1)` when not in a TTY, enabling proper JSON-mode error handling
- `release bump --level` validation against `major|minor|patch` via custom parser
- `repo invite --role` and `repo grant --role` validation against `pull|push|admin|maintain|triage` via custom parser
- `milestone list --status` validation against `open|closed` via custom parser
- `repos report` search API rate limiting — switched from concurrent `Promise.all` to sequential calls with `dates.sleep(6_000)` between requests
- `renderTable()` and `renderKeyValues()` now print a trailing blank line so success/warn messages no longer glue to table bottoms
- `profile add` prompts for missing `--token` instead of calling the service with `undefined`
- `profile switch` throws `ConfigError` instead of `process.exit(1)` for consistent JSON error output
- `leaks scan` throws `GhitgudError` on invalid `--limit` instead of silently falling back to `100`
- `pr push` returns a structured `{ success: true, metadata: {...} }` result instead of `undefined`
- `config set` no longer leaks the token prefix in prompt `initialValue`
- `discussion view` argument validated with `parse.parsePositiveInt()` before passing to the service
- `run debug` removed unused fire-and-forget `checksApi.getCheckRun()` call
- `getMergeDuration` guarded against null `merged_at` with early return

### Changed

- Replaced chained `!==` comparisons with self-documenting `Set`-based validators (`VALID_BUMP_LEVELS`, `VALID_REPO_ROLES`, `VALID_MILESTONE_STATUSES`)
- Logger reverted to consola's default fancy reporter with clean colored icons

### Added

- Organization command family: `ghg org members`, `ghg org invite`, and `ghg org remove` for managing organization membership
- Team command family: `ghg team list`, `ghg team create`, `ghg team add`, and `ghg team remove` for managing organization teams and team membership
- Repository collaborator invitation with `ghg repo invite --user <name> --role <role>`
- Repository team access granting with `ghg repo grant --team <name> --role <role>`
- Full API wrappers for organization members, teams, and repository invites in `src/api/orgs.ts`, `src/api/teams.ts`, and `src/api/invites.ts`
- Full services and command coverage with interactive prompts for missing arguments
- Expanded tests for `repo` command covering `parseRepo` validation, role custom parser, and prompt fallbacks
- Expanded tests for `config` command covering prompt flows and token placeholder security
- Validation tests for `release bump --level` rejecting invalid values and accepting valid ones

## [2.13.0] - 2026-06-06

### Added

- Variables command family: list, set, and delete repository, environment, and organization variables
- Environments command family: list, create, and manage protection rules (reviewers, branch policies, wait timers)
- Secrets command family: list, set, and delete encrypted repository, environment, and organization secrets with libsodium public-key encryption
- Renamed `ghg secrets scan` and `ghg secrets alerts` to `ghg leaks` to free the `secret` command surface for repository secrets
- Full API, service, command, and test coverage for the new variables, environments, and secrets modules
- TUI integration for Variables, Environments, and Secrets workspaces with full CRUD operations

## [2.12.1] - 2026-06-05

### Fixed

- GraphQL Discussions schema alignment: replaced invalid `filterBy` argument with `categoryId` on `discussions`, removed non-existent `state` and `pinned` fields in favor of `closed`, and removed non-existent `pinDiscussion`/`unpinDiscussion` mutations
- Discussion commands updated: removed `pin` and `unpin` subcommands, `state` now derived from `closed` field
- README, TUI, types, and tests updated to reflect the corrected Discussion surface

## [2.12.0] - 2026-06-05

### Added

- GitHub Discussions command family: list, view, create, comment, close, pin, unpin, and categories
- GraphQL-based Discussions API with category filtering, number-to-node ID resolution, and mutation support
- Discussion TUI workspace with full CRUD operations
- Full API, service, command, and test coverage for the new Discussions module

## [2.11.0] - 2026-06-04

### Added

- Enterprise security and compliance suite for platform teams
- Audit log querying for organizations and enterprises with actor, action, repo, and date range filters
- Repository compliance scoring across README, LICENSE, SECURITY.md, CODEOWNERS, branch protection, rulesets, vulnerability alerts, and archive status with percentage score and remediation guidance
- Dependabot alert listing with severity, ecosystem, package, and scope filters across single or multiple repositories
- Dependabot alert dismissal with validated reasons and optional comment, gated behind an explicit confirmation flag
- Local secret scanning across tracked files and recent git history with regex-based detection for tokens, keys, and high-entropy strings, with automatic value redaction in output
- GitHub secret scanning alert listing with state, type, resolution, and date range filters across repositories
- Full API, service, command, and test coverage for the new security modules

## [2.10.1] - 2026-06-04

### Fixed

- Windows CI compatibility: fixed path separator assertions in `labels` service tests, skipped POSIX file permission check on Windows in `config` tests, and normalized `resolveInsideRoot` test expectations
- Type errors in `tests/unit/tui/operations.test.ts` and `tests/unit/tui/state.test.ts`

### Changed

- Refactored `src/tui/operations.ts` into `src/tui/operations/` workspace modules
- Raised coverage thresholds to 85/80/75/85 (statements/branches/functions/lines)
- CI now runs `pnpm test:coverage` with threshold enforcement
- CI matrix expanded to `ubuntu-latest`, `macos-latest`, `windows-latest`
- Coverage reports uploaded as artifacts via `actions/upload-artifact@v6`

### Added

- Renovate configuration for daily dependency updates at ~2am
- `CODEOWNERS` file with `@airscripts`
- Coverage badge in README
- 141 new tests bringing total to 594 (from 453)

## [2.10.0] - 2026-06-04

### Added

- Release automation commands: `ghg release changelog`, `bump`, `verify`, `notes`, and `draft`
- Conventional commit parsing for auto-detecting next semver bump (feat is minor, fix is patch, BREAKING is major)
- Template-based release notes generation with variables: `VERSION`, `CHANGELOG`, `REPO`, `DATE`, `PREVIOUS_TAG`
- GPG tag and commit signature verification
- Draft release creation on GitHub with auto-generated or custom notes
- Default release notes template at `templates/release.md`

## [2.9.0] - 2026-06-02

### Added

- Milestone management for tracking sprint progress with create, list, close, and progress commands
- ASCII kanban board rendering for GitHub Project v2 via `ghg project board`
- Issue subtask management with create and link support
- Issue parent linking to organize related issues

## [2.8.1] - 2026-05-31

### Added

- Interactive dashboard in TUI with real-time data display
- Mouse support for TUI navigation and interaction
- Terminal responsiveness with automatic layout adaptation

### Changed

- Updated tagline for improved clarity

## [2.8.0] - 2026-05-31

### Added

- Full-screen interactive TUI mode via `ghg tui`
- Keyboard-driven PR and issue browsing with vim bindings
- Inline commenting and PR approval without leaving TUI
- Split-pane layout: list on left, detail on right

## [2.7.0] - 2026-05-31

### Added

- Code review commands for line-specific comments, thread management, and inline suggestions
- Batch apply support for review suggestions as local commits
- Review thread resolution from the terminal

### Changed

- Renamed `gh` passthrough to `proxy` for clearer command intent

## [2.6.0] - 2026-05-30

### Added

- Workflow validation and preview commands for GitHub Actions
- Cache inspect and download commands for Actions cache debugging
- Run debug command for fetching workflow run logs, artifacts, and annotations

## [2.5.0] - 2026-05-24

### Added

- Repository Insights commands (traffic, contributors, commits, frequency, popularity, participation)
- Interactive prompts via @clack/prompts for missing required arguments
- Loading spinners for async operations with ora
- Progress bars for bulk repository operations with cli-progress
- Box-based output formatting with Unicode borders via boxen
- Relative date formatting with date-fns
- Theme detection (dark/light/auto) for terminal output
- Config `unset` command to remove configuration values

## [2.4.0] - 2026-05-23

### Added

- Bulk repository governance commands for inspecting, governing, labeling, retiring, and reporting on repositories

## [2.3.0] - 2026-05-22

### Added

- Multi-account profile system with add, list, switch, and detect commands
- Per-repository .ghitgudrc file support for automatic profile detection

## [2.2.0] - 2026-05-13

### Added

- PR lifecycle commands including cleanup, push, stack management, and navigation

## [2.1.0] - 2026-05-09

### Added

- GitHub passthrough command
- Notifications, activity, and mentions commands

## [2.0.0] - 2026-05-09

### Added

- Config get and label template support
- Layered CLI architecture
- Vite build pipeline and multi-step CI/CD
- Comprehensive test suite with coverage reporting

## [1.0.1] - 2025-05-09

### Changed

- Base metadata folder path

## [1.0.0] - 2025-05-09

### Added

- Initial release with labels, ping, and config commands
