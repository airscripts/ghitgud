import git from "@/core/git";
import logger from "@/core/logger";
import { describe, it, expect, vi, beforeEach } from "vitest";

const execSyncMock = vi.fn();

vi.mock("child_process", () => ({
  execSync: vi.fn((...args: unknown[]) => {
    return execSyncMock(...args);
  }),
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function mockExecSync(stdout: string) {
  execSyncMock.mockReturnValue(stdout);
}

function mockExecSyncThrow(error: Error) {
  execSyncMock.mockImplementation(() => {
    throw error;
  });
}

describe("git core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execSyncMock.mockReset();
  });

  it("getCurrentBranch returns trimmed branch name", () => {
    mockExecSync("feature-branch\n");
    const result = git.getCurrentBranch();
    expect(result).toBe("feature-branch");

    expect(execSyncMock).toHaveBeenCalledWith("git branch --show-current", {
      encoding: "utf8",
    });
  });

  it("branchExistsLocally returns true when git succeeds", () => {
    mockExecSync("");
    const result = git.branchExistsLocally("feature");
    expect(result).toBe(true);

    expect(execSyncMock).toHaveBeenCalledWith(
      "git show-ref --verify --quiet refs/heads/feature",
    );
  });

  it("branchExistsLocally returns false when git fails", () => {
    mockExecSyncThrow(new Error("not found"));
    const result = git.branchExistsLocally("feature");
    expect(result).toBe(false);
  });

  it("branchExistsRemotely returns true when origin has branch", () => {
    mockExecSync("");
    const result = git.branchExistsRemotely("feature");
    expect(result).toBe(true);
  });

  it("branchExistsRemotely returns false when origin does not have branch", () => {
    mockExecSyncThrow(new Error("not found"));
    const result = git.branchExistsRemotely("feature");
    expect(result).toBe(false);
  });

  it("getDefaultBranch returns branch from remote show", () => {
    mockExecSync("main\n");
    const result = git.getDefaultBranch();
    expect(result).toBe("main");
  });

  it("getDefaultBranch falls back to main on error", () => {
    mockExecSyncThrow(new Error("no remote"));
    const result = git.getDefaultBranch();
    expect(result).toBe("main");
  });

  it("getRepoRoot returns the repository root", () => {
    mockExecSync("/repo/root\n");
    const result = git.getRepoRoot();
    expect(result).toBe("/repo/root");

    expect(execSyncMock).toHaveBeenCalledWith("git rev-parse --show-toplevel", {
      encoding: "utf8",
    });
  });

  it("getRemoteUrl returns the configured remote url", () => {
    mockExecSync("https://github.com/owner/repo.git\n");
    const result = git.getRemoteUrl();
    expect(result).toBe("https://github.com/owner/repo.git");

    expect(execSyncMock).toHaveBeenCalledWith("git remote get-url origin", {
      encoding: "utf8",
    });
  });

  it("getRemoteUrl falls back to another remote when origin is missing", () => {
    execSyncMock.mockImplementation((command: string) => {
      if (command === "git remote get-url origin") {
        throw new Error("missing origin");
      }

      if (command === "git remote") {
        return "upstream\nfork\n";
      }

      if (command === "git remote get-url upstream") {
        return "https://github.com/owner/repo.git\n";
      }

      throw new Error(`unexpected command: ${command}`);
    });

    const result = git.getRemoteUrl();
    expect(result).toBe("https://github.com/owner/repo.git");

    expect(execSyncMock).toHaveBeenCalledWith("git remote", {
      encoding: "utf8",
    });
  });

  it("parseRepoFromRemoteUrl parses ssh and https remotes", () => {
    expect(git.parseRepoFromRemoteUrl("git@github.com:owner/repo.git")).toBe(
      "owner/repo",
    );

    expect(
      git.parseRepoFromRemoteUrl("https://github.com/owner/repo.git"),
    ).toBe("owner/repo");

    expect(git.parseRepoFromRemoteUrl("https://example.com/repo.git")).toBe(
      null,
    );
  });

  it("getRemoteNames returns all configured remote names", () => {
    mockExecSync("origin\nupstream\n");
    const result = git.getRemoteNames();
    expect(result).toEqual(["origin", "upstream"]);
  });

  it("deleteLocalBranch deletes branch and returns true", () => {
    mockExecSync("");
    const result = git.deleteLocalBranch("feature");
    expect(result).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith("git branch -D feature");
  });

  it("deleteLocalBranch logs info in dry-run and returns true", () => {
    const result = git.deleteLocalBranch("feature", true);
    expect(result).toBe(true);
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it("deleteLocalBranch returns false on error", () => {
    mockExecSyncThrow(new Error("not found"));
    const result = git.deleteLocalBranch("feature");
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("deleteRemoteBranch deletes remote branch and returns true", () => {
    mockExecSync("");
    const result = git.deleteRemoteBranch("feature");
    expect(result).toBe(true);

    expect(execSyncMock).toHaveBeenCalledWith(
      "git push origin --delete feature",
    );
  });

  it("deleteRemoteBranch logs info in dry-run and returns true", () => {
    const result = git.deleteRemoteBranch("feature", true);
    expect(result).toBe(true);
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it("deleteRemoteBranch returns false on error", () => {
    mockExecSyncThrow(new Error("rejected"));
    const result = git.deleteRemoteBranch("feature");
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("fastForwardBase checks out and pulls base branch", () => {
    mockExecSync("");
    const result = git.fastForwardBase("main");
    expect(result).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith("git checkout main");
    expect(execSyncMock).toHaveBeenCalledWith("git pull origin main --ff-only");
  });

  it("fastForwardBase logs info in dry-run and returns true", () => {
    const result = git.fastForwardBase("main", true);
    expect(result).toBe(true);
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it("fastForwardBase returns false on error", () => {
    mockExecSyncThrow(new Error("merge conflict"));
    const result = git.fastForwardBase("main");
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("checkoutBranch runs git checkout", () => {
    mockExecSync("");
    git.checkoutBranch("main");
    expect(execSyncMock).toHaveBeenCalledWith("git checkout main");
  });

  it("remoteExists returns true when remote is present", () => {
    mockExecSync("https://github.com/owner/repo.git\n");
    const result = git.remoteExists("origin");
    expect(result).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith("git remote get-url origin");
  });

  it("remoteExists returns false when remote is absent", () => {
    mockExecSyncThrow(new Error("not found"));
    const result = git.remoteExists("fork");
    expect(result).toBe(false);
  });

  it("addRemote adds a remote", () => {
    mockExecSync("");
    git.addRemote("fork", "https://github.com/fork/repo.git");

    expect(execSyncMock).toHaveBeenCalledWith(
      "git remote add fork https://github.com/fork/repo.git",
      { stdio: "inherit" },
    );
  });

  it("pushToRemote pushes without force by default", () => {
    mockExecSync("");
    git.pushToRemote("origin", "feature", false);

    expect(execSyncMock).toHaveBeenCalledWith("git push origin HEAD:feature", {
      stdio: "inherit",
    });
  });

  it("pushToRemote pushes with force-with-lease when force is true", () => {
    mockExecSync("");
    git.pushToRemote("origin", "feature", true);

    expect(execSyncMock).toHaveBeenCalledWith(
      "git push --force-with-lease origin HEAD:feature",
      { stdio: "inherit" },
    );
  });

  it("branchExistsOnRemote returns true when remote has branch", () => {
    mockExecSync("abc123\trefs/heads/feature\n");
    const result = git.branchExistsOnRemote("origin", "feature");
    expect(result).toBe(true);
  });

  it("branchExistsOnRemote returns false when remote lacks branch", () => {
    mockExecSyncThrow(new Error("not found"));
    const result = git.branchExistsOnRemote("origin", "feature");
    expect(result).toBe(false);
  });

  it("hasDiverged returns false when local is ancestor of remote", () => {
    mockExecSync("");
    const result = git.hasDiverged("feature", "origin/feature");
    expect(result).toBe(false);
  });

  it("hasDiverged returns true when local has diverged", () => {
    mockExecSyncThrow(new Error("not ancestor"));
    const result = git.hasDiverged("feature", "origin/feature");
    expect(result).toBe(true);
  });

  it("listBranches returns array of branch names", () => {
    mockExecSync("main\nfeature\nhotfix\n");
    const result = git.listBranches();
    expect(result).toEqual(["main", "feature", "hotfix"]);
  });

  it("listBranches handles empty output", () => {
    mockExecSync("");
    const result = git.listBranches();
    expect(result).toEqual([]);
  });

  it("rebaseBranch checks out and rebases", () => {
    mockExecSync("");
    git.rebaseBranch("feature", "main");
    expect(execSyncMock).toHaveBeenCalledWith("git checkout feature");
    expect(execSyncMock).toHaveBeenCalledWith("git rebase main");
  });

  it("pushBranch pushes with force-with-lease and sets upstream", () => {
    mockExecSync("");
    git.pushBranch("feature");

    expect(execSyncMock).toHaveBeenCalledWith(
      "git push -u origin feature --force-with-lease",
    );
  });
});
