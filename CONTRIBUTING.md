# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository, ensuring you follow the [Code of Conduct](https://github.com/airscripts/ghitgud/blob/main/CODE_OF_CONDUCT.md).

## Development Setup

```bash
pnpm install            # install dependencies
pnpm build              # build with Vite (single CJS bundle)
pnpm start              # run the CLI locally
pnpm test               # run tests (watch mode)
pnpm test -- --run      # single test run
pnpm test:coverage      # run tests with coverage report
pnpm typecheck          # type check without emitting
pnpm lint               # type check (alias for typecheck)
pnpm clean              # remove dist/ and coverage/
bash scripts/clean.sh   # remove local config directory (~/.config/ghitgud)
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
