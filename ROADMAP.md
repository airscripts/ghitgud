# Ghitgud Roadmap

This document tracks planned features that have not yet been implemented. Entries follow a consistent format so that the transition from roadmap to implementation is unambiguous.

Each milestone entry must include:

- **ID** — A short, unique identifier (alphanumeric, e.g. `a1b2c3d4`) used to cross-reference the milestone across CHANGELOG and commits.
- **Title** — A concise, human-readable name for the feature family.
- **Why gh doesn't have it** — A one-sentence explanation of the gap this fills compared to the official `gh` CLI.
- **Commands** — Every `ghg` subcommand the milestone will add, listed with their full invocation (flags are optional but positional args and required flags must be shown).
- **Value** — A one-sentence summary of the user benefit.

Example:

```
## k8l9m0n1 — Code Search & Navigation

**Why gh doesn't have it:** `gh search` is limited to text queries. No symbol navigation, definition lookup, or PR-aware blame exists.

**Commands:**

- `ghg code search <query> --repo <repo>` — semantic code search
- `ghg code definitions <symbol>` — find symbol definitions
- `ghg code references <symbol>` — find symbol references
- `ghg code file <path> --line <num>` — view file at specific commit
- `ghg code blame <file>` — enhanced blame with PR context

**Value:** Code review and debugging stay in the terminal without switching to the browser for navigation.
```

When a milestone is fully implemented, remove its entry from this file and add the corresponding CHANGELOG entries under `[Unreleased]`.

---

(This roadmap is currently empty. All planned milestones have been implemented.)
