import client from "./client";

interface BranchProtectionInput {
  required_status_checks?: {
    checks: Array<{ name: string }>;
    strict?: boolean;
  };
  required_pull_request_reviews?: {
    required_approving_review_count?: number;
    dismiss_stale_reviews?: boolean;
  };
  enforce_admins?: boolean;
  restrictions?: null;
  allow_force_pushes?: boolean;
}

const getBranchProtection = (repo: string, branch: string): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/branches/${encodeURIComponent(branch)}/protection`,
  );

const protect = (
  repo: string,
  branch: string,
  input: BranchProtectionInput,
): Promise<Response> =>
  client.putTokenRequired(
    `/repos/${repo}/branches/${encodeURIComponent(branch)}/protection`,
    input,
  );

const unprotect = (repo: string, branch: string): Promise<Response> =>
  client.deleteTokenRequired(
    `/repos/${repo}/branches/${encodeURIComponent(branch)}/protection`,
  );

const listBranchProtection = async (
  repo: string,
): Promise<Array<{ branch: string; protected: boolean }>> => {
  const branches = await client.getPaginated<{
    name: string;
    protected?: boolean;
  }>(`/repos/${repo}/branches?per_page=${client.getDefaultPerPage()}`);

  return branches
    .filter((b) => b.protected)
    .map((b) => ({ branch: b.name, protected: true }));
};

const listTagProtection = (repo: string): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/tags-protection`);

const createTagProtection = (
  repo: string,
  pattern: string,
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/tags-protection`, { pattern });

const deleteTagProtection = (repo: string, id: number): Promise<Response> =>
  client.deleteTokenRequired(`/repos/${repo}/tags-protection/${id}`);

export default {
  getBranchProtection,
  protect,
  unprotect,
  listBranchProtection,
  listTagProtection,
  createTagProtection,
  deleteTagProtection,
};
export type { BranchProtectionInput };
