interface Label {
  name: string;
  color: string;
  newName?: string;
  description: string;
}

interface RepoTargetOptions {
  org?: string;
  user?: string;
  file?: string;
  repos?: string;
  limit?: number | string;
}

interface RepoSummary {
  id: number;
  name: string;
  fork: boolean;
  fullName: string;
  private: boolean;
  archived: boolean;
  defaultBranch: string;
  pushedAt: string | null;
}

interface RepoInspectResult {
  score: number;
  present: string[];
  missing: string[];
}

interface AuditEvent {
  id: string;
  action: string;
  repo: string | null;
  actor: string | null;
  createdAt: string | null;
  raw: Record<string, unknown>;
}

type SecretScanConfidence = "high" | "medium" | "low";

interface SecretScanFinding {
  file: string;
  rule: string;
  match: string;
  line?: number;
  confidence: SecretScanConfidence;
}

interface SecretScanningAlert {
  url: string;
  state: string;
  number: number;
  createdAt: string;
  secretType: string;
  repository: string;
  resolution: string | null;
  resolvedAt: string | null;
  secretTypeDisplayName: string;
}

interface DependabotAlert {
  state: string;
  number: number;
  severity: string;
  advisory: string;
  ecosystem: string;
  repository: string;
  packageName: string;
  manifestPath: string;
  dismissedReason: string | null;
}

type ComplianceCheckStatus = "pass" | "fail" | "unknown";

interface ComplianceCheck {
  id: string;
  label: string;
  message: string;
  status: ComplianceCheckStatus;
}

interface ComplianceResult {
  repo: string;
  score: number;
  remediation: string[];
  checks: ComplianceCheck[];
}

interface BulkRepoResult<T = unknown> {
  repo: string;
  metadata?: T;
  error?: string;
  success: boolean;
}

interface BulkRepoMetadata<T = unknown> {
  failed: number;
  completed: number;
  results: BulkRepoResult<T>[];
}

interface RulesetInput {
  name: string;
  target?: string;
  rules?: unknown[];
  enforcement?: string;
  conditions?: unknown;
}

interface Profile {
  token?: string;
}

interface CredentialsFile {
  token?: string;
  activeProfile?: string;
  profiles?: Record<string, Profile>;
}

interface ProfileRcFile {
  profile?: string;
}

interface WorkflowValidationIssue {
  file: string;
  rule: string;
  line?: number;
  message: string;
  level: "error" | "warning";
}

interface WorkflowValidateResult {
  file: string;
  valid: boolean;
  issues: WorkflowValidationIssue[];
}

interface WorkflowDryRunJob {
  id: string;
  needs: string[];
  matrix: string[];
  runsOn: string | null;
}

interface WorkflowDryRunResult {
  file: string;
  triggers: string[];
  jobs: WorkflowDryRunJob[];
  workflowName: string | null;
  unresolvedExpressions: string[];
}

interface ActionsCacheEntry {
  id: number;
  key: string;
  ref: string;
  version: string;
  createdAt: string;
  sizeInBytes: number;
  lastAccessedAt: string;
}

interface WorkflowSummary {
  id: number;
  name: string;
  path: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

interface GistFile {
  filename: string;
  type: string | null;
  language: string | null;
  rawUrl: string;
  size: number;
  content?: string;
  truncated?: boolean;
}

interface GistSummary {
  id: string;
  description: string | null;
  public: boolean;
  htmlUrl: string;
  gitPullUrl: string;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
  files: GistFile[];
}

interface WebhookSummary {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: number;
  guid: string;
  deliveredAt: string;
  statusCode: number;
  duration: number;
  event: string;
  action: string | null;
}

interface RunDebugJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  checkRunUrl: string | null;
}

interface RunDebugArtifact {
  id: number;
  name: string;
  sizeInBytes: number;
  archiveDownloadUrl: string;
}

interface RunDebugResult {
  repo: string;
  runId: number;
  status: string;
  outputDir: string;
  jobs: RunDebugJob[];
  conclusion: string | null;
  artifacts: RunDebugArtifact[];
  annotations: Array<{ path: string; message: string; level: string }>;
  files: {
    artifacts: string[];
    logsZip: string | null;
  };
}

interface ReviewComment {
  id: number;
  body: string;
  path: string;
  line: number;
  diffHunk?: string;
  createdAt: string;
  inReplyToId?: number;
  side: "LEFT" | "RIGHT";
  user: { login: string };
}

interface ReviewThread {
  id: number;
  path: string;
  line: number;
  resolved: boolean;
  comments: ReviewComment[];
}

interface ReviewSuggestion {
  id: number;
  path: string;
  line: number;
  originalText: string;
  suggestedText: string;
}

interface ReviewApplyResult {
  branch: string;
  applied: number;
  skipped: number;
}

type MilestoneState = "open" | "closed";

interface Milestone {
  id: number;
  url: string;
  title: string;
  number: number;
  html_url: string;
  open_issues: number;
  state: MilestoneState;
  due_on: string | null;
  closed_issues: number;
}

interface MilestoneProgress {
  title: string;
  total: number;
  percent: number;
  openIssues: number;
  closedIssues: number;
}

interface IssueSummary {
  id?: number;
  url?: string;
  title: string;
  state?: string;
  number?: number;
  node_id?: string;
  locked?: boolean;
  html_url?: string;
  isPinned?: boolean;
  created_at?: string;
  updated_at?: string;
  body?: string | null;
  user?: { login: string } | null;
  active_lock_reason?: string | null;
  assignees?: Array<{ login: string }>;
  type?: { name?: string } | string | null;
  labels?: Array<string | { name?: string }>;
}

interface PullRequestUser {
  login: string;
}

interface PullRequest {
  title: string;
  state: string;
  number: number;
  merged: boolean;
  draft?: boolean;
  html_url?: string;
  created_at?: string;
  updated_at?: string;
  body?: string | null;
  mergeable_state?: string;
  merged_at?: string | null;
  mergeable?: boolean | null;
  user?: PullRequestUser | null;
  maintainer_can_modify: boolean;
  merge_commit_sha: string | null;
  labels?: Array<{ name: string }>;
  requested_reviewers?: PullRequestUser[];

  head: {
    ref: string;
    sha?: string;
    repo: { full_name: string; html_url: string } | null;
  };

  base: {
    ref: string;
    repo?: { full_name: string } | null;
  };
}

interface RepositoryMergeSettings {
  default_branch: string;
  allow_rebase_merge: boolean;
  allow_squash_merge: boolean;
  allow_merge_commit: boolean;
}

type SubIssueSummary = IssueSummary;

interface ProjectBoardItem {
  url?: string;
  type: string;
  title: string;
  state?: string;
  number?: number;
}

interface ProjectBoardColumn {
  name: string;
  items: ProjectBoardItem[];
}

interface ProjectBoard {
  owner: string;
  title: string;
  number: number;
  columns: ProjectBoardColumn[];
}

interface ProjectSummary {
  id: string;
  number: number;
  title: string;
  description: string;
  closed: boolean;
  url: string;
  updatedAt?: string;
}

interface ProjectItem {
  id: string;
  type: string;
  title: string;
  status: string;
  state?: string;
  number?: number;
  url?: string;
  repository?: string;
}

interface ProjectField {
  id: string;
  name: string;
  dataType: string;
  options?: Array<{ id: string; name: string }>;
}

interface DeploymentSummary {
  id: number;
  ref: string;
  environment: string;
  task: string;
  description: string | null;
  creator: string | null;
  createdAt: string;
  production: boolean;
}

interface DeploymentStatusSummary {
  id: number;
  state: string;
  description: string | null;
  creator: string | null;
  createdAt: string;
}

interface BranchProtection {
  pattern: string;
  requiredChecks: string[];
  requiredReviews: number;
  dismissStale: boolean;
  enforceAdmins: boolean;
  allowForcePushes: boolean;
}

interface TagProtection {
  id: number;
  pattern: string;
  createdAt: string;
}

interface GistComment {
  id: number;
  body: string;
  user: string | null;
  createdAt: string;
}

interface ReactionSummary {
  id: number;
  content: string;
  user: string | null;
  createdAt: string;
}

interface CommentSummary {
  id: number;
  body: string;
  author: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DependencyEntry {
  name: string;
  version: string;
  ecosystem: string;
}

interface DependencyReviewChange {
  changeType: string;
  package: string;
  ecosystem: string;
  version: string;
  severity: string;
  vulnerabilities: number;
}

interface AdvisorySummary {
  ghsaId: string;
  summary: string;
  severity: string;
  ecosystem: string;
  cveId: string | null;
  publishedAt: string;
  htmlUrl: string;
}

interface CodeQLAlertSummary {
  number: number;
  rule: string;
  severity: string;
  state: string;
  tool: string;
  createdAt: string;
}

interface CodeSearchResult {
  file: string;
  repo: string;
  url: string;
}

interface BlameEntry {
  sha: string;
  author: string;
  date: string;
  message: string;
  pr: string;
}

interface IssueTemplate {
  name: string;
  filename: string;
  path: string;
  body: string | null;
  about: string | null;
  title: string | null;
  labels: string[];
  assignees: string[];
}

interface PackageSummary {
  id: number;
  name: string;
  packageType: string;
  visibility: string;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  repository: string;
}

interface PackageVersion {
  id: number;
  name: string;
  version: string;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface RunnerSummary {
  id: number;
  name: string;
  os: string;
  status: string;
  busy: boolean;
  labels: string[];
}

interface RunnerLabel {
  id: number;
  name: string;
  type: string;
}

interface AdvisoryCreateInput {
  severity: string;
  cveId?: string;
  summary: string;
  description: string;
  vulnerableVersionRange?: string;
  patchedVersionRange?: string;
}

const normalizeLabel = (label: Label) => ({
  name: label.name,
  color: label.color,
  description: label.description,
});

export type { Label };
export type { Profile };
export type { AuditEvent };
export type { RepoSummary };
export type { RulesetInput };
export type { ProfileRcFile };
export type { BulkRepoResult };
export type { CredentialsFile };
export type { DependabotAlert };
export type { ComplianceCheck };
export type { ComplianceResult };
export type { BulkRepoMetadata };
export type { RepoTargetOptions };
export type { RepoInspectResult };
export type { SecretScanFinding };
export type { SecretScanningAlert };
export type { SecretScanConfidence };
export type { ComplianceCheckStatus };
export type { WorkflowValidateResult };
export type { WorkflowValidationIssue };
export type { RunDebugJob };
export type { WorkflowDryRunJob };
export type { ActionsCacheEntry };
export type { WorkflowSummary };
export type { GistFile };
export type { GistSummary };
export type { GistComment };
export type { ReactionSummary };
export type { CommentSummary };
export type { DependencyEntry };
export type { DependencyReviewChange };
export type { AdvisorySummary };
export type { CodeQLAlertSummary };
export type { CodeSearchResult };
export type { BlameEntry };
export type { IssueTemplate };
export type { PackageSummary };
export type { PackageVersion };
export type { RunnerSummary };
export type { RunnerLabel };
export type { AdvisoryCreateInput };
export type { WebhookSummary };
export type { WebhookDelivery };
export type { WorkflowDryRunResult };
export type { ReviewThread };
export type { ReviewComment };
export type { RunDebugResult };
export type { RunDebugArtifact };
export type { ReviewSuggestion };
export type { Milestone };
export type { IssueSummary };
export type { PullRequest };
export type { PullRequestUser };
export type { RepositoryMergeSettings };
export type { ProjectBoard };
export type { ProjectSummary };
export type { ProjectItem };
export type { ProjectField };
export type { MilestoneState };
export type { SubIssueSummary };
export type { ProjectBoardItem };
export type { ReviewApplyResult };
export type { MilestoneProgress };
export type { DeploymentSummary };
export type { DeploymentStatusSummary };
export type { BranchProtection };
export type { TagProtection };
export type { ProjectBoardColumn };
export type { Discussion } from "./discussions";
export type { DiscussionComment } from "./discussions";
export type { DiscussionCategory } from "./discussions";
export type { DiscussionCreateInput } from "./discussions";
export type { DiscussionCommentInput } from "./discussions";

export type { OrgVariable } from "./variables";
export type { RepoVariable } from "./variables";
export type { EnvironmentVariable } from "./variables";
export type { VariableListResponse } from "./variables";

export type { Environment } from "./environments";
export type { EnvironmentListResponse } from "./environments";
export type { EnvironmentProtectionRule } from "./environments";

export type {
  PagesSite,
  PagesBuild,
  PagesSource,
  PagesBuildType,
} from "./pages";

export type { WikiPage, WikiPageContent } from "./wiki";

export type { OrgSecret } from "./secrets";
export type { RepoSecret } from "./secrets";
export type { SecretVisibility } from "./secrets";
export type { EnvironmentSecret } from "./secrets";
export type { PublicKeyResponse } from "./secrets";
export type { SecretListResponse } from "./secrets";
export type { EncryptedSecretInput } from "./secrets";

export type { AuthUser, AuthStatus } from "./auth";

export type {
  SearchResult,
  SearchOptions,
  RepoSearchItem,
  CodeSearchItem,
  IssueSearchItem,
  CommitSearchItem,
} from "./search";

export {
  normalizeRepoSearchItem,
  normalizeCodeSearchItem,
  normalizeIssueSearchItem,
  normalizeCommitSearchItem,
} from "./search";

export { normalizeLabel };
