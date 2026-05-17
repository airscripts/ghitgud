# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-05-13

### Added

- `pr cleanup` command to delete merged branches locally and remotely
- `pr cleanup --dry-run` flag to preview changes without applying them
- `pr cleanup --force` flag to skip ahead-of-base safety checks
- `pr push <pr-number>` command to push local changes back to contributor's fork
- `pr stack init --base <branch>` command to initialize a stacked PR chain
- `pr stack add <branch> --depends-on <branch>` command to add PRs to a stack
- `pr stack status` command to view stacked PR chain status
- `pr stack sync` command to synchronize stacked PRs with base branch
- `pr next` command to checkout the next PR in a dependency chain
- `pr next --reverse` command to checkout the previous PR in a chain
- `src/api/pr.ts` for GitHub pull request API calls
- `src/services/pr.ts` with branch detection, squash/rebase safety, and fast-forward logic
- `src/services/stack.ts` for stacked PR chain management
- `src/commands/pr.ts` with self-registering `pr` subcommand module
- `src/core/git.ts` for Git operations (branch detection, remote tracking, fast-forward)
- Unit tests for `pr` service functionality
- Unit tests for `stack` service functionality
- Unit tests for `core/git` operations
- Fast-forward of default branch (`main`/`master`) after cleanup

## [2.1.0] - 2026-05-09

### Added

- `ghitgud gh` passthrough command — proxy any args to the gh CLI
- `notifications list` with `--all`, `--participating`, `--repo`, `--limit`
- `notifications read <id>`
- `notifications done <id>`
- `activity` — composite view of assigned issues, review requests, mentions
- `mentions` — search for recent @mentions
- `client.put` method in API layer

## [2.0.0] - 2025-05-09

### Added

- `config get <key>` command to retrieve stored configuration values
- `labels pull --template <name>` flag for pulling from built-in label templates
- `labels push --template <name>` flag for pushing from built-in label templates
- `core/format.ts` for consistent JSON output to stdout and stderr
- `core/errors.ts` with `GhitgudError` hierarchy (`AuthError`, `ConfigError`, `NotFoundError`, `UnprocessableError`)
- `core/io.ts` with generic file helpers (`readJsonFile`, `writeJsonFile`, `fileExists`, `ensureDir`)
- `api/client.ts` as a base HTTP client with auth guard, 2xx success checks, and error registry pattern
- `services/config.ts` with `validateKey` helper for supported config keys
- `services/labels.ts` with `upsertLabels` helper and `normalizeLabel` in types
- Structured JSON error output `{ success: false, error: "..." }` to stderr
- Consistent JSON output shape `{ success: true, ... }` for all commands including `ping`
- Global error boundary in `cli/index.ts` catching `GhitgudError` subclasses
- Self-registering command modules exported as `{ register }` functions
- Version read from `VERSION` file at runtime instead of hardcoded
- `core/constants.ts` centralizing all shared constants, error messages, and config type definitions
- Multi-step CI/CD with reusable workflows (verify, build, test, deploy)
- Vite-based build pipeline replacing `tsc` + `tsc-alias`, producing a single CJS bundle with shebang
- `@/` import aliases resolved by Vite at build time and `tsconfig` paths for type checking (no `baseUrl`, TS 7.0-ready)
- `typecheck`, `lint`, `clean`, and `prepublishOnly` scripts in `package.json`
- `files`, `engines`, and `env.d.ts` declarations in `package.json` for npm publishing safety
- `.npmrc` with `save-exact=true` for deterministic dependency resolution
- `coverage/` in `.gitignore`
- GitHub Actions workflows with `cache: pnpm` for faster CI runs
- Test suite expanded from 1 file to 13 files covering api, cli, commands, core, and services
- `@vitest/coverage-v8` integrated with `test:coverage` script
- Tests for `cli/ascii.ts` and `cli/index.ts`

### Changed

- Restructured CLI into layered architecture: `cli/ → commands/ → services/ → api/ → core/`
- Eliminated circular dependency between old `app/config.js` and `app/functions.js`
- Split monolithic `app/library.ts` into focused `services/labels.ts` and `services/config.ts`
- Replaced declarative commands dictionary with self-registering command modules
- All HTTP 2xx status codes now accepted (previously only 200)
- `labels prune` now awaits all delete promises instead of fire-and-forget
- `console.info` replaced with `console.log` for proper stdout behavior
- Error registry pattern (`ERROR_MAP`, `ERROR_MESSAGES`) local to `client.ts` for extensible status-to-error mapping
- `handleError` in `client.ts` now throws `GhitgudError` for unmapped status codes instead of bare `Error`
- Build output changed from `dist/cli/index.js` to single `dist/index.js` bundle
- Templates copied to `dist/templates/` at build time, resolved via `__dirname` at runtime
- CI workflows reordered to install pnpm before setting up Node.js caching
- `@vitest/coverage-v8` version aligned with `vitest` (3.2.4)
- `templates/conventional.json` reindented from 4 spaces to 2 spaces
- GitHub Actions upgraded to Node.js 24, checkout@v6, setup-node@v6, pnpm/action-setup@v6

### Fixed

- `labels prune` fire-and-forget bug: all delete promises are now awaited
- `handleError` in `client.ts` now throws `GhitgudError` for unmapped status codes instead of bare `Error`
- Redundant `declare const __VERSION__` removed from `cli/index.ts` (already in `env.d.ts`)
- `baseUrl` removed from `tsconfig.json` — `paths` resolves relative to tsconfig location (TS 7.0-ready)
- `tests/tsconfig.json` added for test type checking with correct `@/` path resolution
- `package-lock.json` removed (project uses pnpm exclusively)
- `vitest.config.ts` merged into `vite.config.ts` using `defineConfig` from `vitest/config`
- `io` module mocked in `labels.test.ts` for push/prune tests — no real filesystem hits
- Duplicates removed from `labels.test.ts` test suite

## [1.0.1] - 2025-05-09

### Changed

- Base metadata folder path changed

## [1.0.0] - 2025-05-09

### Added

- Base CLI with `labels`, `ping`, and `config` commands
- GitHub label templates (base, conventional, github)
