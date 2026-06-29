# AGENTS.md

## 1. Overview

`ghg` is a TypeScript CLI for GitHub workflow automation. It extends day-to-day GitHub work with notification triage, pull request helpers, profile/config management, label syncing, repository governance, and repository insights. The runtime is Node.js, the CLI layer is Commander, and the codebase uses a layered structure:

CLI entrypoint -> command modules -> services -> API/core helpers -> shared types

The project now has a human-first terminal UX with explicit `--json` support. Status messaging goes through the shared logger and renderer stack in `src/core/`.

## 2. Repository Structure

```text
src/
  api/
    client.ts         # shared GitHub HTTP client, auth, pagination, error mapping
    commits.ts
    contents.ts
    insights.ts
    issues.ts
    labels.ts
    notifications.ts
    pr.ts
    pulls.ts
    repos.ts
    rulesets.ts
  cli/
    ascii.ts          # banner used in help output
    index.ts          # root Commander program, global flags, error boundary
  commands/
    activity.ts
    config.ts
    gh.ts
    insights.ts
    labels.ts
    mentions.ts
    notifications.ts
    ping.ts
    pr.ts
    auth.ts
    repos.ts
  core/
    command.ts        # shared command runner
    config.ts         # env + credentials + profile resolution
    constants.ts
    dates.ts
    errors.ts
    git.ts
    io.ts
    logger.ts
    output-state.ts
    output.ts
    progress.ts
    prompt.ts
    spinner.ts
    theme.ts
  services/
    repos/
      govern.ts
      index.ts
      inspect.ts
      label.ts
      report.ts
      retire.ts
    config.ts
    insights.ts
    labels.ts
    notifications.ts
    pr.ts
    auth.ts
    stack.ts
  types/
    index.ts
    notifications.ts
  tui/
    app.ts            # Full-screen TUI runtime
    index.ts          # TUI entry and renderer wiring
    types.ts          # TUI-specific types
    operations/       # Workspace operation definitions
      index.ts        # Concatenates all workspace arrays
      shared.ts       # Input helpers (text, numberValue, targetOptions, etc.)
      dashboard.ts
      notifications.ts
      labels.ts
      prs.ts
      review.ts
      milestones.ts
      projects.ts
      issues.ts
      repositories.ts
      insights.ts
      workflow.ts
      cache.ts
      run.ts
      auth.ts
      config.ts
      utility.ts
      release.ts
    layout.ts         # Screen layout calculations
    mouse.ts          # Mouse event parsing
    render.ts         # Ink-based rendering
    state.ts          # Dashboard and context state
    status.ts         # Status bar items
  env.d.ts
templates/
  base.json
  conventional.json
  github.json
tests/
  unit/
    api/
    cli/
    commands/
    core/
    services/
scripts/
  clean.sh
package.json
tsconfig.json
tests/tsconfig.json
vite.config.ts
eslint.config.mjs
.prettierrc.json
VERSION
```

- Add new commands in `src/commands/`. Each module exports a `register(program)` entry.
- Put business logic in `src/services/`. Services orchestrate API calls, git helpers, filesystem access, and rendering decisions.
- Put GitHub REST wrappers in `src/api/`. Never call `fetch` outside `src/api/client.ts`.
- Put shared terminal UX primitives in `src/core/`. Human output is centralized there.
- Keep shared interfaces in `src/types/`.

## 3. Build, Test, and Local Workflows

```bash
pnpm install
pnpm build
pnpm start
pnpm test
pnpm test -- --run
pnpm test:coverage
pnpm lint
pnpm format
pnpm format:check
pnpm typecheck
npx tsc --noEmit -p tests/tsconfig.json
pnpm clean
bash scripts/clean.sh
```

`pnpm build` produces `dist/index.js` and copies `templates/` into `dist/`.

## 4. Architecture and Boundaries

- `src/cli/index.ts` owns global flags, help behavior, command registration, and the top-level error boundary.
- Command modules should stay thin. Parse flags, prompt when needed, then hand off to a service.
- Services contain the main workflow logic. They may render user-facing output through `core/output`, `core/spinner`, `core/progress`, and `core/logger`.
- API modules wrap GitHub endpoints and use the shared client for headers, auth, request methods, pagination, and HTTP-to-error mapping.
- Config resolution is centralized in `src/core/config.ts`. Do not import `dotenv/config` anywhere else.
- Shared constants belong in `src/core/constants.ts`.
- Shared error types belong in `src/core/errors.ts`.

## 5. Commands and Product Surface

Current command families:

- `ghg notifications ...`
- `ghg activity`
- `ghg mentions`
- `ghg labels ...`
- `ghg repos ...`
- `ghg insights ...`
- `ghg pr ...`
- `ghg auth ...`
- `ghg config ...`
- `ghg gh ...`
- `ghg ping`

Repository governance lives under `ghg repos`:

- `inspect`
- `govern`
- `label`
- `retire`
- `report`

The root CLI supports `--json` and `--theme <dark|light|auto>`.

## 6. Code Style

TypeScript formatting is strict and Prettier-driven:

- 2-space indentation
- double quotes
- semicolons required
- trailing commas in multi-line literals/imports
- 80-column `printWidth`
- one blank line between top-level definitions in most files

The codebase uses `camelCase` for functions and variables, `PascalCase` for interfaces and classes, and `SCREAMING_SNAKE_CASE` for module-level constants.

Imports are grouped in this order with blank lines between groups:

1. Node/stdlib
2. third-party packages
3. local `@/` imports

Use `export default` at the end of modules where that is the existing pattern.

## 7. Output and UX Conventions

- Human-readable terminal output is the default.
- Machine-readable output is explicit with `--json`.
- Use `src/core/output.ts` for tables, summaries, sections, lists, key/value blocks, JSON result writing, and error rendering.
- Use `src/core/logger.ts` for status lines such as `start`, `success`, `warn`, and `error`.
- Use `src/core/spinner.ts` for single async loading states.
- Use `src/core/progress.ts` for bulk progress across repositories or item collections.
- Use `src/core/theme.ts` and shared color helpers instead of ad hoc ANSI styling.
- Do not scatter raw `console.log` calls across services or commands. Terminal rendering should flow through the shared output layer.

## 8. Error Handling

Custom error types live in `src/core/errors.ts`:

- `GhitgudError`
- `AuthError`
- `ConfigError`
- `NotFoundError`
- `UnprocessableError`
- `RateLimitError`
- `TokenRequiredError`

Rules:

- Throw a domain-specific error for expected CLI and API failures.
- Map HTTP failures in `src/api/client.ts`.
- Let the CLI boundary format and print errors through `output.writeError(...)`.
- Avoid broad `try/catch` blocks in services unless they are needed to translate low-level failures into stable user-facing behavior.

## 9. Types and Data Modeling

- Shared types live primarily in `src/types/index.ts` and `src/types/notifications.ts`.
- Keep function signatures typed under `strict` TypeScript settings.
- Prefer extending existing shared interfaces before inventing command-local duplicates for cross-cutting concepts like repo targets, repo summaries, labels, and bulk results.

## 10. Testing

The project uses Vitest. Tests live under `tests/unit/` by domain:

- `tests/unit/api`
- `tests/unit/cli`
- `tests/unit/commands`
- `tests/unit/core`
- `tests/unit/services`

Conventions:

- Name files `<module>.test.ts`.
- Use `describe(...)` and `it(...)`.
- Mock API modules with `vi.mock(...)`.
- Spy on logger/output helpers when asserting UX behavior.
- Do not make real HTTP calls in tests.
- Do not rely on real filesystem state unless a test is explicitly about file I/O and is isolated.

## 10b. Playbooks

Playbooks are shell scripts in `playbooks/` that verify `ghg` works correctly against the live GitHub API. Every command family has a corresponding playbook. When adding a new command, you must also add a playbook.

- Each playbook is named `<command>.sh` (e.g., `pages.sh`, `wiki.sh`).
- Every playbook sources `playbooks/env.sh` for shared configuration (`REPO`, `ORG`, `TMPDIR`, `GHG_TOKEN` validation) and assertion helpers (`step`, `pass`, `fail`, `skip`, `expect_exit_0`, `expect_exit_non0`, `expect_output`, `expect_json_field`).
- Each playbook defines `setup()` and `teardown()` functions with `trap teardown EXIT` to guarantee cleanup.
- Playbooks test both positive and negative cases. Every mutation is reverted in teardown.
- Non-reversible resources (environments, open PRs) are moved to a closed terminal state with a `[noop]` title.
- Test resources are prefixed with `ghg-test-` or `ghg_` for easy identification.
- The `config.sh` playbook never modifies the `token` key — it uses a dedicated `ghg_playbook_test_key`.
- The orchestrator `playbooks/all.sh` runs every playbook sequentially. Use `SKIP="run.sh,project.sh"` to skip playbooks or `PARALLEL=1` for concurrent execution.
- Output uses `[INFO]`, `[OK]`, `[ERROR]`, `[WARN]`, and `[DEBUG]` prefixes — no emojis or decorative lines.
- Step labels use Title Case: `step "Deploy With Workflow Build Type"`.

## 11. Git and Release Conventions

Observed commit prefixes are mostly:

- `feat:`
- `chore:`
- `tests:`
- `refactor:`
- `fix:`
- `ci:`

Other prefixes appear occasionally, but the dominant pattern is:

- lowercase prefix
- colon and space
- short imperative subject
- no scope
- usually no commit body

The repository history is rebase-oriented and generally avoids merge commits.

### Version Bump Procedure

When a feature milestone is complete and ready to ship, perform these steps in order:

1. **Update `VERSION`** — Set the file contents to the new version string (e.g., `2.12.0`).
2. **Update `package.json`** — Bump the `version` field to match.
3. **Update `CITATION.cff`** — Bump `version` and set `date-released` to today.
4. **Update `CHANGELOG.md`** — Add a new section for the release at the top of the file, following the Keep a Changelog format. Summarize the additions, changes, and fixes from the milestone.
5. **Update `ROADMAP.md`** — Remove the completed version section so the next planned version becomes the first entry.
6. **Update `README.md`** — Add new features/commands to the features list, commands table, and repository structure tree.
7. **Verify** — Run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm test:coverage` to confirm everything is clean and coverage meets the 80% threshold before the release commit.
8. **Conventional Commit Summary** — After the build phase, present a single concise conventional commit message to the user summarizing all changes made. Follow the project's commit style: lowercase prefix, colon and space, short imperative subject, no scope, usually no body. Example: `feat: add visual mode and clipboard support to TUI`.

## 12. Dependencies and Tooling

Primary runtime and UX dependencies:

- `commander`
- `consola`
- `dotenv`
- `figlet`
- `boxen`
- `picocolors`
- `ora`
- `cli-progress`
- `@clack/prompts`
- `date-fns`

Tooling:

- Vite for builds
- Vitest for tests
- ESLint flat config for linting
- Prettier for formatting
- TypeScript with `strict: true`
- `@/*` import alias via `tsconfig.json`

Node and package manager expectations come from `package.json`:

- Node.js `>=24`
- pnpm `>=10`

## 13. Red Lines

- Never call `fetch` outside `src/api/client.ts`.
- Never import `dotenv/config` outside `src/core/config.ts`.
- Never bypass `src/core/output.ts` for structured CLI rendering.
- Never add new magic strings or duplicated shared messages when they belong in `src/core/constants.ts`.
- Never throw bare `Error` for expected domain failures when a custom `GhitgudError` subclass is appropriate.
- Never put new commands directly in `src/cli/index.ts`.
- Never add a command without also adding a corresponding playbook in `playbooks/`.
- Never place tests beside source files.
- Never introduce formatting drift from Prettier or lint drift from ESLint.
- Never assume JSON mode is the default. Human-mode UX is the default interface now.
