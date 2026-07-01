import type { ProviderCapability } from "@/domain/provider";

export interface OperationFamily {
  name: string;
  description: string;
  capability?: ProviderCapability;
}

const definitions = [
  ["auth", "Manage provider accounts and profiles."],
  ["repo", "Manage repositories.", "repositories"],
  ["change", "Manage proposed changes.", "changes"],
  ["review", "Manage reviews and conversations.", "reviews"],
  ["issue", "Manage issues and work items.", "issues"],
  ["pipeline", "Manage pipelines, runs, artifacts, and caches.", "pipelines"],
  ["release", "Manage releases and assets.", "releases"],
  ["workspace", "Manage repository fleets."],
  ["govern", "Inspect and govern repository fleets.", "governance"],
  ["policy", "Manage repository policies.", "repositoryPolicies"],
  ["planning", "Manage boards, milestones, and iterations.", "planning"],
  ["wiki", "Manage repository wikis.", "wiki"],
  ["site", "Manage static repository sites.", "site"],
  ["discussion", "Manage provider discussions.", "discussions"],
  [
    "inbox",
    "Manage notifications, activity, and review requests.",
    "notifications",
  ],
  ["search", "Search provider resources.", "search"],
  ["code", "Inspect repository code and history.", "code"],
  ["label", "Manage and synchronize labels.", "labels"],
  ["template", "Discover repository templates.", "templates"],
  ["deps", "Inspect dependencies and dependency changes.", "dependencies"],
  ["advisory", "Manage security advisories.", "advisories"],
  ["attestation", "Inspect and verify artifact provenance.", "attestations"],
  ["security", "Inspect security alerts, audit, and compliance.", "security"],
  ["registry", "Manage packages and container images.", "registry"],
  ["dev", "Manage hosted development environments.", "developmentEnvironments"],
  ["deploy", "Manage deployments.", "deployments"],
  ["environment", "Manage deployment environments.", "environments"],
  ["secret", "Manage provider secrets.", "secrets"],
  ["variable", "Manage provider variables.", "variables"],
  ["runner", "Manage pipeline runners.", "runners"],
  ["webhook", "Manage webhooks and deliveries.", "webhooks"],
  ["access", "Manage organizations, groups, teams, and access.", "access"],
  ["identity", "Manage provider account identity keys.", "identity"],
  ["analytics", "Inspect repository and pipeline analytics.", "analytics"],
  ["snippet", "Manage provider-hosted snippets.", "snippets"],
  ["license", "Discover and inspect licenses.", "licenses"],
  ["browse", "Open provider resources in a browser.", "browsing"],
  ["api", "Make a raw request to the active provider.", "rawApi"],
  ["alias", "Manage Gitfleet command aliases."],
  ["completion", "Generate shell completions."],
  ["config", "Manage Gitfleet configuration."],
  ["tui", "Open the full-screen interface."],
  ["help", "Show help for Gitfleet or a command."],
  ["version", "Show version information."],
] as const satisfies ReadonlyArray<
  readonly [string, string, ProviderCapability?]
>;

export const operationFamilies: readonly OperationFamily[] = definitions.map(
  ([name, description, capability]) => ({
    name,
    description,
    capability,
  }),
);

const byName = new Map(
  operationFamilies.map((family) => [family.name, family]),
);

const legacyNames: Readonly<Record<string, string>> = {
  pr: "change",
  workflow: "pipeline",
  run: "pipeline",
  cache: "pipeline",
  ruleset: "policy",
  project: "planning",
  milestone: "planning",
  pages: "site",
  gist: "snippet",
  codespace: "dev",
  deployment: "deploy",
  package: "registry",
  labels: "label",
  licenses: "license",
  notifications: "inbox",
  activity: "inbox",
  mentions: "inbox",
  status: "inbox",
  audit: "security",
  leaks: "security",
  dependabot: "security",
  compliance: "security",
  codeql: "security",
  insights: "analytics",
  actions: "analytics",
  org: "access",
  team: "access",
  "ssh-key": "identity",
  "gpg-key": "identity",
  repos: "govern",
  branch: "policy",
  fork: "repo",
};

const legacyPaths: Readonly<Record<string, readonly string[]>> = {
  workflow: ["pipeline", "definition"],
  run: ["pipeline", "run"],
  cache: ["pipeline", "cache"],
  queue: ["change", "queue"],
  milestone: ["planning", "milestone"],
  notifications: ["inbox", "notifications"],
  activity: ["inbox", "activity"],
  mentions: ["inbox", "mentions"],
  status: ["inbox", "status"],
  audit: ["security", "audit"],
  leaks: ["security", "leaks"],
  dependabot: ["security", "dependabot"],
  compliance: ["security", "compliance"],
  codeql: ["security", "codeql"],
  insights: ["analytics", "repo"],
  actions: ["analytics", "pipeline"],
  org: ["access", "org"],
  team: ["access", "team"],
  "ssh-key": ["identity", "ssh"],
  "gpg-key": ["identity", "gpg"],
  branch: ["policy", "branch"],
  fork: ["repo", "forks"],
  react: ["review", "reaction"],
  comment: ["review", "conversation"],
};

export function getOperationFamily(name: string): OperationFamily | undefined {
  return byName.get(name);
}

export function canonicalFamilyName(name: string): string {
  return legacyNames[name] ?? name;
}

export function normalizeOperationCommand(command: string): string {
  const tokens = command.trim().split(/\s+/);
  if (tokens[0] === "gf") {
    tokens[0] = "gitfleet";
  }
  if (tokens[0] === "gitfleet" && tokens[1]) {
    const replacement = legacyPaths[tokens[1]];
    if (replacement) {
      tokens.splice(1, 1, ...replacement);
    } else {
      tokens[1] = canonicalFamilyName(tokens[1]);
    }
  }
  return tokens.join(" ");
}
