interface Label {
  name: string;
  color: string;
  newName?: string;
  description: string;
}

interface RepoTargetOptions {
  org?: string;
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
  repo?: string;
  token?: string;
}

interface CredentialsFile {
  repo?: string;
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
  html_url?: string;
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

const normalizeLabel = (label: Label) => ({
  name: label.name,
  color: label.color,
  description: label.description,
});

export type { Label };
export type { Profile };
export type { CredentialsFile };
export type { ProfileRcFile };
export type { RepoTargetOptions };
export type { RepoSummary };
export type { RepoInspectResult };
export type { BulkRepoResult };
export type { BulkRepoMetadata };
export type { RulesetInput };
export type { WorkflowValidationIssue };
export type { WorkflowValidateResult };
export type { WorkflowDryRunJob };
export type { WorkflowDryRunResult };
export type { ActionsCacheEntry };
export type { RunDebugJob };
export type { RunDebugArtifact };
export type { RunDebugResult };
export type { ReviewComment };
export type { ReviewThread };
export type { ReviewSuggestion };
export type { ReviewApplyResult };
export type { Milestone };
export type { MilestoneState };
export type { MilestoneProgress };
export type { IssueSummary };
export type { SubIssueSummary };
export type { ProjectBoard };
export type { ProjectBoardColumn };
export type { ProjectBoardItem };
export { normalizeLabel };
