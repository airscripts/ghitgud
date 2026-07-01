# Gitfleet 0.1.0 Refactor Plan

## Objective

Rebuild the project in place as Gitfleet, a provider-neutral CLI and TUI for
managing repositories from creation and cloning through collaboration,
delivery, security, analytics, and governance.

GitHub is the first provider implementation. The design must not expose
GitHub payloads or terminology outside its adapter. Git history is preserved,
but Gitfleet starts a new release line at `0.1.0` without compatibility
obligations to `ghg`.

All implementation work remains unstaged. Publishing, commits, tags, releases,
remote changes, and repository renaming are performed manually by the owner.

## Engineering Standards

- Follow `AGENTS.md` throughout implementation, review, testing, and handoff.
- Keep command modules and UI surfaces thin; business logic belongs in typed
  application use cases.
- Keep all provider HTTP traffic inside provider clients.
- Use domain-specific errors for expected failures.
- Preserve human-first output with explicit, stable JSON output.
- Require confirmation for destructive human-mode operations and `--yes` in
  JSON or non-interactive mode.
- Give bulk mutations a dry-run mode where a preview is meaningful.
- Add tests outside source directories and live playbooks for every retained
  command family.

## Target Architecture

```text
CLI / TUI
    |
Shared operation registry
    |
Application use cases
    |
Provider-neutral domain contracts
    |
Provider registry
    |
GitHub provider
```

The source tree will be reorganized around these boundaries:

- `domain`: provider-neutral entities, identifiers, capabilities, results,
  and errors.
- `application`: rendering-free use cases and bulk orchestration.
- `providers/github`: GitHub client, wire types, normalization, and capability
  implementations.
- `operations`: canonical operation definitions, inputs, validation, safety
  metadata, and handlers.
- `surfaces`: Commander CLI, Ink TUI, human renderer, and JSON renderer.
- `infrastructure`: configuration, credentials, git, filesystem, logging,
  process execution, concurrency, and cancellation.

Dependencies flow downward only. Application code cannot import a provider,
terminal renderer, Commander, or Ink. Provider payloads are normalized before
leaving the adapter.

### Provider contracts

Introduce provider-aware references from the beginning:

```ts
type ProviderId = "github";

interface AccountRef {
  provider: ProviderId;
  host: string;
  profile: string;
}

interface RepositoryRef {
  provider: ProviderId;
  host: string;
  namespace: string;
  name: string;
}

interface GitProvider {
  readonly id: ProviderId;
  capabilities(): ProviderCapabilities;
  // Typed capability interfaces are exposed here.
}
```

Capability interfaces cover repositories, changes, reviews, issues,
pipelines, releases, planning, documentation, security, registries,
development environments, access, analytics, and governance. Unsupported
operations return a stable capability error. The TUI hides or disables them
and the CLI explains which provider lacks the capability.

Portable contracts contain only semantics that providers genuinely share.
Provider-specific options remain namespaced adapter extensions rather than
weakening shared types with unstructured fields.

### Shared operation registry

Define every user operation once with:

- command path, description, arguments, options, and input schema;
- capability requirements and provider scope;
- mutation, confirmation, and dry-run metadata;
- application handler and typed result;
- human and JSON presentation metadata.

The CLI, TUI, help, and shell completion consume this registry. Workspace
execution dispatches operations directly instead of spawning the Gitfleet
binary. Bulk execution uses bounded concurrency, stable ordering,
cancellation, and per-target results.

## Public Command Surface

Gitfleet installs the `gitfleet` and `gf` binaries with identical behavior.
There is no `ghg` compatibility binary.

| Command       | Responsibility                                                   |
| ------------- | ---------------------------------------------------------------- |
| `auth`        | Accounts, login, logout, status, and profile switching           |
| `repo`        | Repository lifecycle, forks, synchronization, and stale branches |
| `change`      | Pull/merge requests, stacks, checks, and merge automation        |
| `review`      | Review threads, comments, suggestions, reactions, and resolution |
| `issue`       | Issues, sub-issues, issue types, comments, and lifecycle         |
| `pipeline`    | Pipeline definitions, runs, logs, artifacts, and caches          |
| `release`     | Releases, notes, assets, versions, and lifecycle                 |
| `workspace`   | Named fleets and multi-repository execution                      |
| `govern`      | Inspection, governance, retirement, and reporting                |
| `policy`      | Repository rules and branch or tag protection                    |
| `planning`    | Boards, work items, milestones, and iterations                   |
| `wiki`        | Repository and project wiki management                           |
| `site`        | Static repository site configuration and deployment              |
| `discussion`  | Provider discussion and forum capabilities                       |
| `inbox`       | Notifications, activity, mentions, status, and review requests   |
| `search`      | Repository, change, issue, commit, and code search               |
| `code`        | Files, definitions, references, history, and blame               |
| `label`       | Label CRUD, templates, bulk operations, and synchronization      |
| `template`    | Issue and change template discovery                              |
| `deps`        | Dependency graph and dependency review                           |
| `advisory`    | Public and repository advisory lifecycle                         |
| `attestation` | Artifact provenance and verification                             |
| `security`    | Scanning, dependency alerts, leaks, audit, and compliance        |
| `registry`    | Package and container registries                                 |
| `dev`         | Provider-hosted development environments                         |
| `deploy`      | Deployments and deployment statuses                              |
| `environment` | Deployment environments and protection rules                     |
| `secret`      | Repository, environment, and organization secrets                |
| `variable`    | Repository, environment, and organization variables              |
| `runner`      | Hosted and self-hosted runners                                   |
| `webhook`     | Webhooks, deliveries, tests, and redelivery                      |
| `access`      | Organizations, groups, teams, collaborators, and invitations     |
| `identity`    | Provider account SSH and GPG keys                                |
| `analytics`   | Traffic, contributors, activity, CI usage, and cost              |
| `snippet`     | Provider-hosted snippets such as Gists                           |
| `license`     | License discovery and repository licensing                       |
| `browse`      | Open provider resources in a browser                             |
| `api`         | Provider-aware raw API escape hatch                              |
| `alias`       | Gitfleet command aliases                                         |
| `completion`  | Shell completion generation                                      |
| `config`      | Gitfleet configuration                                           |
| `tui`         | Full-screen interface                                            |
| `version`     | Version information                                              |

Public terminology is provider-neutral. Important mappings include:

- GitHub pull requests and GitLab merge requests become `change`.
- GitHub Actions and GitLab CI/CD become `pipeline`.
- GitHub Projects and GitLab issue boards become `planning`.
- GitHub Pages and GitLab Pages become `site`.
- GitHub Gists and GitLab Snippets become `snippet`.
- GitHub Codespaces and GitLab Workspaces become `dev`.
- Rulesets and branch protection become `policy`.
- Organizations, groups, teams, and invitations become `access`.

Provider-specific features such as merge queues, merge trains, rulesets, and
custom planning fields remain available through capability-gated operations.
Gitfleet does not reduce providers to their lowest common denominator.

## Removed Surface

Remove these command families and all associated services, API wrappers, TUI
operations, tests, playbooks, dependencies, constants, and documentation:

- Copilot integration;
- prompt preview utilities;
- agent task management;
- agent skill management;
- the current GitHub-compatible extension system;
- `gh` proxying and automatic passthrough;
- native `gh` parity aliases, flags, and compatibility-only behavior.

Historical gap-filling workflows are retained when they represent a reusable
repository-management capability. They are renamed and moved behind provider
contracts rather than removed merely because another CLI later implemented
them.

There is no public `supply-chain` namespace. Dependencies, advisories,
attestations, registries, and security remain separate commands.

## Identity and Configuration

- Rename all active product identifiers to lowercase `gitfleet`.
- Prepare the npm package as `gitfleet` at version `0.1.0`.
- Use `~/.config/gitfleet`, `.gitfleetrc`, and `GITFLEET_*` variables.
- Start clean and do not read or migrate `~/.config/ghitgud`.
- Retain mode-`0600` JSON credentials, named profiles, environment token
  overrides, and repository-local profile selection.
- Add provider and host to every stored account.
- Parse standard SSH and HTTPS remotes into provider, host, namespace, and
  repository without assuming `github.com`.
- Remove active ghitgud branding and the “better GitHub CLI” positioning.

## Delivery Sequence

1. Record the passing baseline and freeze feature additions.
2. Add domain contracts, provider-aware references, capability errors, and the
   provider registry.
3. Move the shared HTTP client and existing GitHub wire integrations behind a
   GitHub provider boundary.
4. Normalize retained GitHub payloads into domain entities at that boundary.
5. Rebuild workflows as typed, rendering-free application use cases.
6. Introduce the shared operation registry and make the CLI and TUI consume
   it.
7. Replace workspace subprocess recursion with direct application dispatch.
8. Port each retained command vertically through the new architecture.
9. Remove excluded functionality and unused dependencies.
10. Rename binaries, configuration, help, UI, package metadata, templates,
    documentation, tests, playbooks, and local release automation.
11. Set local version and release documentation to Gitfleet `0.1.0`.
12. Run the complete verification suite and perform an AGENTS.md compliance
    review.
13. Leave all modifications unstaged and provide the owner with manual
    publication and cleanup instructions.

## Testing and Review

- Run every provider through a shared contract suite for its declared
  capabilities.
- Test the GitHub adapter for normalization, pagination, authentication,
  enterprise hosts, rate limits, errors, and capability reporting.
- Validate operation names, inputs, safety metadata, capability requirements,
  JSON shapes, and CLI/TUI parity.
- Cover workspace concurrency, stable ordering, cancellation, partial
  failures, dry runs, and direct dispatch.
- Verify credential permissions, precedence, provider/host profiles, remote
  parsing, and isolation from old ghitgud files.
- Give every retained command family unit tests, command integration tests,
  and a reversible live GitHub playbook.
- Assert removed commands are absent from help, completions, TUI navigation,
  built packages, and documentation.
- Review the final diff for provider leakage, unsafe mutations, inconsistent
  errors, output drift, duplicated operations, and obsolete branding.

Required local gates:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
npx tsc --noEmit -p tests/tsconfig.json
pnpm test:coverage
pnpm build
```

Coverage must remain at or above 80 percent for lines, branches, functions,
and statements. Live playbooks run only with credentials and explicit
authorization.

## Acceptance Criteria

- `gitfleet` and `gf` expose identical behavior and `ghg` is absent.
- Application and UI code do not import GitHub wire types.
- Provider HTTP traffic exists only inside the GitHub provider.
- CLI, TUI, help, and completion derive from the shared operation registry.
- Every retained workflow operates through declared provider capabilities.
- Workspaces support provider-qualified repositories without subprocess
  recursion.
- Human output, JSON output, errors, confirmations, and exit codes are
  consistent.
- All required checks pass and coverage meets the repository threshold.
- The complete implementation remains in unstaged working-tree changes.

## Owner Handoff

Do not stage, commit, tag, push, publish, alter remotes, rename the remote
repository, or delete releases or tags. The final handoff must include:

- verification and coverage results;
- retained and removed capability summaries;
- unstaged `git status`;
- one proposed conventional commit message;
- manual GitHub repository rename instructions;
- an audited list and manual commands for deleting historical releases and
  local or remote version tags;
- the manual npm publication checklist for `gitfleet`.
