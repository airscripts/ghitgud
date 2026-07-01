export type ProviderId = "github";

export interface AccountRef {
  provider: ProviderId;
  host: string;
  profile: string;
}

export interface RepositoryRef {
  provider: ProviderId;
  host: string;
  namespace: string;
  name: string;
}

export type PolicyTarget = { repository: string } | { namespace: string };

export type ProviderCapability =
  | "repositories"
  | "changes"
  | "reviews"
  | "issues"
  | "pipelines"
  | "releases"
  | "planning"
  | "wiki"
  | "site"
  | "discussions"
  | "security"
  | "registry"
  | "developmentEnvironments"
  | "deployments"
  | "environments"
  | "runners"
  | "webhooks"
  | "access"
  | "identity"
  | "analytics"
  | "snippets"
  | "governance"
  | "mergeAutomation"
  | "repositoryPolicies"
  | "notifications"
  | "search"
  | "code"
  | "labels"
  | "templates"
  | "dependencies"
  | "advisories"
  | "attestations"
  | "secrets"
  | "variables"
  | "licenses"
  | "browsing"
  | "rawApi";

export type ProviderCapabilities = Readonly<
  Record<ProviderCapability, boolean>
>;

export interface GitProvider {
  readonly id: ProviderId;
  readonly defaultHost: string;
  capabilities(): ProviderCapabilities;
}

export function formatRepositoryPath(repository: RepositoryRef): string {
  return `${repository.namespace}/${repository.name}`;
}

export function formatRepositoryRef(repository: RepositoryRef): string {
  return `${repository.provider}@${repository.host}:${formatRepositoryPath(repository)}`;
}
