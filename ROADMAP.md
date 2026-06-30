# Ghitgud Roadmap

---

## k8l9m0n1 — Code Search & Navigation

**Why gh doesn't have it:** `gh search` is limited to text queries. No symbol navigation, definition lookup, or PR-aware blame exists.

**Commands:**

- `ghg code search <query> --repo <repo>` — semantic code search
- `ghg code definitions <symbol>` — find symbol definitions
- `ghg code references <symbol>` — find symbol references
- `ghg code file <path> --line <num>` — view file at specific commit
- `ghg code blame <file>` — enhanced blame with PR context

**Value:** Code review and debugging stay in the terminal without switching to the browser for navigation.

---

## s6t7u8v9 — Rulesets & Templates

**Why gh doesn't have it:** `gh ruleset` only supports `view`. No create/edit/delete commands. Issue template discovery is broken and label sync across repos requires custom scripts.

**Commands:**

- `ghg template list` — list available issue/PR templates
- `ghg template show <name>` — preview template
- `ghg label bulk --file <path>` — create labels from JSON/YAML
- `ghg label sync --source <repo>` — sync labels from another repo

**Value:** Organizations managing 100+ repos get rulesets as code and template discovery that actually works.

---

## c2d3e4f5 — Package & Container Registry

**Why gh doesn't have it:** No package management CLI commands exist. GHCR is growing fast.

**Commands:**

- `ghg package list [--org <org>] [--repo <repo>] [--type npm|docker|maven|...]`
- `ghg package view <package-name>`
- `ghg package versions <package-name>`
- `ghg package delete <package-name> --version <version> [--yes]`
- `ghg package restore <package-name> --version <version>`
- `ghg package download <package-name> --version <version> --output <file>`

**Value:** GHCR is growing fast. Managing container images and packages from the terminal rounds out the repo management story.

---

## g6h7i8j9 — Self-Hosted Runner Management

**Why gh doesn't have it:** No runner CLI commands exist. Orgs with self-hosted runners have zero CLI tooling.

**Commands:**

- `ghg runner list [--repo <repo>] [--org <org>] [--label <label>]`
- `ghg runner view <id>`
- `ghg runner status <id>` — health and busy status
- `ghg runner remove <id> [--yes]`
- `ghg runner labels <id>` — list labels for a runner

**Value:** Niche but orgs with self-hosted runners have zero CLI tooling.

---

## o4p5q6r7 — Security Advisories

**Why gh doesn't have it:** No advisory CLI commands exist. ghg already has a security surface (dependabot, leaks, audit, compliance).

**Commands:**

- `ghg advisory list [--repo <repo>] [--state published|draft|triage]`
- `ghg advisory view <id>`
- `ghg advisory create --title <title> --description <text> --severity critical|high|medium|low`
- `ghg advisory publish <id>`
- `ghg advisory close <id>`
- `ghg advisory cve-request <id>`

**Value:** Security advisories are a growing concern. Nobody owns this CLI space yet.
