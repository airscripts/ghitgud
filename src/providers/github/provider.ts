import type { GitProvider, ProviderCapabilities } from "@/domain/provider";

const capabilities: ProviderCapabilities = Object.freeze({
  repositories: true,
  changes: true,
  reviews: true,
  issues: true,
  pipelines: true,
  releases: true,
  planning: true,
  wiki: true,
  site: true,
  discussions: true,
  security: true,
  registry: true,
  developmentEnvironments: true,
  deployments: true,
  environments: true,
  runners: true,
  webhooks: true,
  access: true,
  identity: true,
  analytics: true,
  snippets: true,
  governance: true,
  mergeAutomation: true,
  repositoryPolicies: true,
  notifications: true,
  search: true,
  code: true,
  labels: true,
  templates: true,
  dependencies: true,
  advisories: true,
  attestations: true,
  secrets: true,
  variables: true,
  licenses: true,
  browsing: true,
  rawApi: true,
});

const githubProvider: GitProvider = {
  id: "github",
  defaultHost: "github.com",
  capabilities: () => capabilities,
};

export default githubProvider;
