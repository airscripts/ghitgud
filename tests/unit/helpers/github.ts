const makePullRequest = (overrides: Record<string, unknown> = {}) => ({
  number: 1,
  state: "open",
  merged: false,
  title: "PR Title",
  merge_commit_sha: "abc123",
  maintainer_can_modify: true,

  head: {
    ref: "feature",

    repo: {
      full_name: "owner/repo",
      html_url: "https://github.com/owner/repo",
    },
  },

  base: { ref: "main" },
  ...overrides,
});

const makeReviewComment = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  line: 10,
  side: "RIGHT",
  path: "src/main.ts",
  body: "Looks good.",
  created_at: "2026-05-30",
  user: { login: "alice" },
  ...overrides,
});

const makeWorkflowRun = (overrides: Record<string, unknown> = {}) => ({
  id: 123,
  status: "completed",
  conclusion: "success",
  ...overrides,
});

const makeWorkflowJob = (overrides: Record<string, unknown> = {}) => ({
  id: 456,
  name: "test",
  status: "completed",
  conclusion: "success",
  check_run_url: "https://api.github.com/repos/owner/repo/check-runs/456",
  ...overrides,
});

const makeArtifact = (overrides: Record<string, unknown> = {}) => ({
  id: 789,
  name: "artifact",
  size_in_bytes: 10,

  archive_download_url:
    "https://api.github.com/repos/owner/repo/actions/artifacts/789/zip",

  ...overrides,
});

const makeCacheEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 123,
  version: "v1",
  key: "cache-key",
  size_in_bytes: 100,
  ref: "refs/heads/main",
  created_at: "2026-05-30T00:00:00Z",
  last_accessed_at: "2026-05-31T00:00:00Z",
  ...overrides,
});

export {
  makeArtifact,
  makeCacheEntry,
  makePullRequest,
  makeWorkflowJob,
  makeWorkflowRun,
  makeReviewComment,
};
