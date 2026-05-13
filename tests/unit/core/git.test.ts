import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import git from "@/core/git";
import logger from "@/core/logger";

const execMock = vi.fn();

vi.mock("child_process", () => ({
  exec: vi.fn((...args: unknown[]) => {
    const callback = args[args.length - 1] as (error: Error | null, result?: { stdout: string; stderr: string }) => void;
    execMock(...args.slice(0, -1))
      .then((result: { stdout: string; stderr: string }) => callback(null, result))
      .catch((err: Error) => callback(err));
  }),
}));

vi.mock("@/core/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function mockExec(stdout: string, stderr = "") {
  execMock.mockResolvedValue({ stdout, stderr });
}

function mockExecReject(error: Error) {
  execMock.mockRejectedValue(error);
}

describe("git core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execMock.mockReset();
  });

  it("getCurrentBranch returns trimmed branch name", async () => {
    mockExec("feature-branch\n");
    const result = await git.getCurrentBranch();
    expect(result).toBe("feature-branch");
    expect(execMock).toHaveBeenCalledWith("git branch --show-current");
  });

  it("branchExistsLocally returns true when git succeeds", async () => {
    mockExec("");
    const result = await git.branchExistsLocally("feature");
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith(
      "git show-ref --verify --quiet refs/heads/feature",
    );
  });

  it("branchExistsLocally returns false when git fails", async () => {
    mockExecReject(new Error("not found"));
    const result = await git.branchExistsLocally("feature");
    expect(result).toBe(false);
  });

  it("branchExistsRemotely returns true when origin has branch", async () => {
    mockExec("");
    const result = await git.branchExistsRemotely("feature");
    expect(result).toBe(true);
  });

  it("branchExistsRemotely returns false when origin does not have branch", async () => {
    mockExecReject(new Error("not found"));
    const result = await git.branchExistsRemotely("feature");
    expect(result).toBe(false);
  });

  it("getDefaultBranch returns branch from remote show", async () => {
    mockExec("main\n");
    const result = await git.getDefaultBranch();
    expect(result).toBe("main");
  });

  it("getDefaultBranch falls back to main on error", async () => {
    mockExecReject(new Error("no remote"));
    const result = await git.getDefaultBranch();
    expect(result).toBe("main");
  });

  it("deleteLocalBranch deletes branch and returns true", async () => {
    mockExec("");
    const result = await git.deleteLocalBranch("feature");
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith("git branch -D feature");
  });

  it("deleteLocalBranch logs info in dry-run and returns true", async () => {
    const result = await git.deleteLocalBranch("feature", true);
    expect(result).toBe(true);
    expect(logger.info).toHaveBeenCalledWith("[dry-run] Would delete local branch: feature");
    expect(execMock).not.toHaveBeenCalled();
  });

  it("deleteLocalBranch returns false on error", async () => {
    mockExecReject(new Error("not found"));
    const result = await git.deleteLocalBranch("feature");
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("deleteRemoteBranch deletes remote branch and returns true", async () => {
    mockExec("");
    const result = await git.deleteRemoteBranch("feature");
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith("git push origin --delete feature");
  });

  it("deleteRemoteBranch logs info in dry-run and returns true", async () => {
    const result = await git.deleteRemoteBranch("feature", true);
    expect(result).toBe(true);
    expect(logger.info).toHaveBeenCalledWith("[dry-run] Would delete remote branch: origin/feature");
    expect(execMock).not.toHaveBeenCalled();
  });

  it("deleteRemoteBranch returns false on error", async () => {
    mockExecReject(new Error("rejected"));
    const result = await git.deleteRemoteBranch("feature");
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("fastForwardBase checks out and pulls base branch", async () => {
    mockExec("");
    const result = await git.fastForwardBase("main");
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith("git checkout main");
    expect(execMock).toHaveBeenCalledWith("git pull origin main --ff-only");
  });

  it("fastForwardBase logs info in dry-run and returns true", async () => {
    const result = await git.fastForwardBase("main", true);
    expect(result).toBe(true);
    expect(logger.info).toHaveBeenCalledWith("[dry-run] Would fast-forward main");
    expect(execMock).not.toHaveBeenCalled();
  });

  it("fastForwardBase returns false on error", async () => {
    mockExecReject(new Error("merge conflict"));
    const result = await git.fastForwardBase("main");
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("checkoutBranch runs git checkout", async () => {
    mockExec("");
    await git.checkoutBranch("main");
    expect(execMock).toHaveBeenCalledWith("git checkout main");
  });

  it("remoteExists returns true when remote is present", async () => {
    mockExec("https://github.com/owner/repo.git\n");
    const result = await git.remoteExists("origin");
    expect(result).toBe(true);
    expect(execMock).toHaveBeenCalledWith(
      "git remote get-url origin",
      expect.objectContaining({ stdio: expect.anything() }),
    );
  });

  it("remoteExists returns false when remote is absent", async () => {
    mockExecReject(new Error("not found"));
    const result = await git.remoteExists("fork");
    expect(result).toBe(false);
  });

  it("addRemote adds a remote", async () => {
    mockExec("");
    await git.addRemote("fork", "https://github.com/fork/repo.git");
    expect(execMock).toHaveBeenCalledWith(
      "git remote add fork https://github.com/fork/repo.git",
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("pushToRemote pushes without force by default", async () => {
    mockExec("");
    await git.pushToRemote("origin", "feature", false);
    expect(execMock).toHaveBeenCalledWith(
      "git push origin HEAD:feature",
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("pushToRemote pushes with force-with-lease when force is true", async () => {
    mockExec("");
    await git.pushToRemote("origin", "feature", true);
    expect(execMock).toHaveBeenCalledWith(
      "git push --force-with-lease origin HEAD:feature",
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("branchExistsOnRemote returns true when remote has branch", async () => {
    mockExec("abc123\trefs/heads/feature\n");
    const result = await git.branchExistsOnRemote("origin", "feature");
    expect(result).toBe(true);
  });

  it("branchExistsOnRemote returns false when remote lacks branch", async () => {
    mockExecReject(new Error("not found"));
    const result = await git.branchExistsOnRemote("origin", "feature");
    expect(result).toBe(false);
  });

  it("hasDiverged returns false when local is ancestor of remote", async () => {
    mockExec("");
    const result = await git.hasDiverged("feature", "origin/feature");
    expect(result).toBe(false);
  });

  it("hasDiverged returns true when local has diverged", async () => {
    mockExecReject(new Error("not ancestor"));
    const result = await git.hasDiverged("feature", "origin/feature");
    expect(result).toBe(true);
  });

  it("listBranches returns array of branch names", async () => {
    mockExec("main\nfeature\nhotfix\n");
    const result = await git.listBranches();
    expect(result).toEqual(["main", "feature", "hotfix"]);
  });

  it("listBranches handles empty output", async () => {
    mockExec("");
    const result = await git.listBranches();
    expect(result).toEqual([]);
  });

  it("rebaseBranch checks out and rebases", async () => {
    mockExec("");
    await git.rebaseBranch("feature", "main");
    expect(execMock).toHaveBeenCalledWith("git checkout feature");
    expect(execMock).toHaveBeenCalledWith("git rebase main");
  });

  it("pushBranch pushes with force-with-lease and sets upstream", async () => {
    mockExec("");
    await git.pushBranch("feature");
    expect(execMock).toHaveBeenCalledWith(
      "git push -u origin feature --force-with-lease",
    );
  });
});
