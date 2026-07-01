# AGENTS.md

## Overview

Gitfleet is a TypeScript CLI and Ink TUI for provider-neutral repository
management. GitHub is the first provider. The dependency direction is:

```text
CLI / TUI -> operations -> application -> domain -> provider contracts
                                                   -> provider adapters
```

`PLAN.md` is the implementation contract and `ROADMAP.md` contains deferred
Rust and GitLab milestones.

## Boundaries

- `src/domain/` contains provider-neutral entities, identifiers, capabilities,
  results, and errors.
- `src/application/` contains rendering-free workflows and bulk orchestration.
- `src/providers/<provider>/` owns provider clients, wire types, endpoint
  wrappers, normalization, and capability implementations.
- `src/operations/` owns the canonical operation and command-family registry.
- `src/commands/` and `src/tui/` are thin surfaces over shared operations.
- `src/core/` owns configuration, git, filesystem, output, logging, prompts,
  progress, and other infrastructure.
- `src/api/` is a temporary compatibility re-export layer. Do not add logic or
  new integrations there.
- `src/services/` contains workflows still being migrated to application use
  cases. Do not introduce new provider payload dependencies there.

Only provider clients may call `fetch`. Normalize provider payloads before
they cross the adapter boundary. Unsupported behavior must use capability
errors instead of emulating another provider.

## Product Conventions

- Human-readable output is the default; `--json` is explicit.
- Use `src/core/output.ts` for rendering and `src/core/logger.ts` for status.
- Use `GitfleetError` subclasses for expected failures.
- Destructive human-mode operations require confirmation.
- Destructive JSON or non-interactive operations require `--yes`.
- Bulk mutations provide dry-run behavior when a preview is meaningful.
- CLI and TUI command labels use provider-neutral terminology from the
  operation registry.
- Configuration lives under `~/.config/gitfleet`; environment variables use
  the `GITFLEET_` prefix.

## Code Style

- Strict TypeScript, 2-space indentation, double quotes, semicolons, trailing
  commas, and Prettier's 80-column width.
- Use camelCase for functions and variables, PascalCase for types and classes,
  and SCREAMING_SNAKE_CASE for module constants.
- Group imports as Node standard library, third-party packages, then local
  `@/` imports with blank lines between groups.
- Keep command registration thin and business behavior typed.
- Never add raw `console.log` rendering outside established output boundaries.
- Never import `dotenv/config` outside configuration infrastructure.

## Testing

Tests use Vitest and live outside source directories:

- `tests/unit/domain`
- `tests/unit/application`
- `tests/unit/operations`
- `tests/unit/providers` or the temporary `tests/unit/api`
- `tests/unit/commands`
- `tests/unit/services`
- `tests/unit/tui`
- `tests/integration`

Do not make real HTTP requests in automated tests. Mock provider clients and
use isolated filesystem state. Every retained command family must have unit,
integration, and reversible live-playbook coverage.

Required gates:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
npx tsc --noEmit -p tests/tsconfig.json
pnpm test:coverage
pnpm build
```

Coverage must remain at or above 80 percent for statements, branches,
functions, and lines.

## Playbooks

Playbooks live under `playbooks/`, source `playbooks/env.sh`, test positive and
negative cases, and always clean up mutations with `trap teardown EXIT`.
Resources use a `gitfleet-test-` or `gitfleet_` prefix. Output uses `[INFO]`,
`[OK]`, `[ERROR]`, `[WARN]`, and `[DEBUG]` without decorative lines.

## Release and Git Rules

- Keep implementation changes unstaged unless the owner explicitly requests
  staging or publication.
- Do not commit, tag, push, publish, alter remotes, rename the remote
  repository, or delete releases.
- Release metadata must agree across `VERSION`, `package.json`,
  `CITATION.cff`, `CHANGELOG.md`, and documentation.
- Conventional commits use a lowercase prefix, colon, space, and a short
  imperative subject.

## Red Lines

- Never call `fetch` outside a provider client.
- Never add provider wire types to domain, application, command, or TUI code.
- Never bypass the shared output layer for structured rendering.
- Never throw bare `Error` for expected failures.
- Never add a public command family outside the operation registry.
- Never add a command without tests and a corresponding playbook.
- Never restore legacy `ghg`, automatic `gh` proxying, or parity-only behavior.
- Never assume unsupported provider capabilities.
- Never stage or publish as part of the Gitfleet 0.1.0 implementation handoff.
