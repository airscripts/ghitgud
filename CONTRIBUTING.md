# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository, ensuring you follow the [Code of Conduct](https://github.com/airscripts/gitfleet/blob/main/CODE_OF_CONDUCT.md).

## Development Setup

```bash
pnpm install            # Install dependencies.
pnpm build              # Build with Vite (single CJS bundle).
pnpm start              # Run the CLI locally.
pnpm test               # Run tests (watch mode).
pnpm test -- --run      # Single test run.
pnpm test:coverage      # Run tests with coverage report.
pnpm typecheck          # Type check without emitting.
pnpm lint               # Run ESLint across source and tests.
pnpm format:check       # Verify Prettier formatting.
pnpm clean              # Remove dist/ and coverage/.
bash scripts/clean.sh   # Remove local config directory (~/.config/gitfleet).
```

## Commit Convention

All commit messages must use a lowercase prefix followed by a colon and space:

- `feat:` — new user-visible behavior
- `fix:` — bug fix
- `refactor:` — code restructure without behavior change
- `chore:` — build, release, dependency, or metadata changes
- `tests:` — test additions or modifications
- `ci:` — CI/CD workflow changes
- `documentation:` — documentation-only changes
- `repo:` — project scaffolding

Subject line: imperative mood, no period, under 50 characters. No scopes. No body.

## Pull Requests

- Use the pull request template provided in the repository.
- Ensure all tests pass before submitting.
- Rebase your branch on `main` before opening a PR.
- One logical change per PR.
