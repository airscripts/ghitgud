# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
