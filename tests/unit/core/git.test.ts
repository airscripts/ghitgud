import { describe, it, expect, vi, beforeEach } from "vitest";

import git from "@/core/git";
import logger from "@/core/logger";

const execFileSyncMock = vi.fn();

vi.mock("child_process", () => ({
  execFileSync: vi.fn((...args: unknown[]) => execFileSyncMock(...args)),
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function mockGit(stdout: string) {
  execFileSyncMock.mockReturnValue(stdout);
}

function mockGitThrow(error: Error) {
  execFileSyncMock.mockImplementation(() => {
    throw error;
  });
}

function expectGit(args: string[], options?: Record<string, unknown>) {
  if (options) {
    expect(execFileSyncMock).toHaveBeenCalledWith("git", args, options);
    return;
  }

  expect(execFileSyncMock).toHaveBeenCalledWith(
    "git",
    args,
    expect.objectContaining({ encoding: "utf8" }),
  );
}

describe("git core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    execFileSyncMock.mockReset();
  });

  it("getCurrentBranch returns trimmed branch name", () => {
    mockGit("feature-branch\n");
    expect(git.getCurrentBranch()).toBe("feature-branch");
    expectGit(["branch", "--show-current"]);
  });

  it("branchExistsLocally returns true when git succeeds", () => {
    mockGit("");
    expect(git.branchExistsLocally("feature")).toBe(true);
    expectGit(["show-ref", "--verify", "--quiet", "refs/heads/feature"]);
  });

  it("branchExistsLocally passes branch names as argv", () => {
    mockGit("");
    expect(git.branchExistsLocally("feature; rm -rf /")).toBe(true);

    expectGit([
      "show-ref",
      "--verify",
      "--quiet",
      "refs/heads/feature; rm -rf /",
    ]);
  });

  it("branchExistsLocally returns false when git fails", () => {
    mockGitThrow(new Error("not found"));
    expect(git.branchExistsLocally("feature")).toBe(false);
  });

  it("branchExistsRemotely returns true when origin has branch", () => {
    mockGit("abc123\trefs/heads/feature\n");
    expect(git.branchExistsRemotely("feature")).toBe(true);
    expectGit(["ls-remote", "--heads", "origin", "feature"]);
  });

  it("branchExistsRemotely returns false for empty output or errors", () => {
    mockGit("");
    expect(git.branchExistsRemotely("feature")).toBe(false);

    mockGitThrow(new Error("not found"));
    expect(git.branchExistsRemotely("feature")).toBe(false);
  });

  it("getDefaultBranch parses remote show output", () => {
    mockGit("* remote origin\n  HEAD branch: trunk\n");
    expect(git.getDefaultBranch()).toBe("trunk");
    expectGit(["remote", "show", "origin"]);
  });

  it("getDefaultBranch falls back to main on error", () => {
    mockGitThrow(new Error("no remote"));
    expect(git.getDefaultBranch()).toBe("main");
  });

  it("getRepoRoot returns the repository root", () => {
    mockGit("/repo/root\n");
    expect(git.getRepoRoot()).toBe("/repo/root");

    expectGit(["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  });

  it("getRemoteNames returns all configured remote names", () => {
    mockGit("origin\nupstream\n");
    expect(git.getRemoteNames()).toEqual(["origin", "upstream"]);
    expectGit(["remote"]);
  });

  it("getRemoteUrl returns the configured remote url", () => {
    mockGit("https://github.com/owner/repo.git\n");
    expect(git.getRemoteUrl()).toBe("https://github.com/owner/repo.git");
    expectGit(["remote", "get-url", "origin"]);
  });

  it("getRemoteUrl falls back to another remote when origin is missing", () => {
    execFileSyncMock.mockImplementation((command: string, args: string[]) => {
      if (command !== "git") throw new Error("unexpected command");

      if (args.join(" ") === "remote get-url origin") {
        throw new Error("missing origin");
      }

      if (args.join(" ") === "remote") {
        return "upstream\nfork\n";
      }

      if (args.join(" ") === "remote get-url upstream") {
        return "https://github.com/owner/repo.git\n";
      }

      throw new Error(`unexpected args: ${args.join(" ")}`);
    });

    expect(git.getRemoteUrl()).toBe("https://github.com/owner/repo.git");
    expectGit(["remote"]);
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

  it("deleteLocalBranch deletes branch and returns true", () => {
    mockGit("");
    expect(git.deleteLocalBranch("feature")).toBe(true);
    expectGit(["branch", "-D", "feature"]);
  });

  it("deleteLocalBranch logs info in dry-run and returns true", () => {
    expect(git.deleteLocalBranch("feature", true)).toBe(true);
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });

  it("deleteLocalBranch returns false on error", () => {
    mockGitThrow(new Error("not found"));
    expect(git.deleteLocalBranch("feature")).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("deleteRemoteBranch deletes remote branch and returns true", () => {
    mockGit("");
    expect(git.deleteRemoteBranch("feature")).toBe(true);
    expectGit(["push", "origin", "--delete", "feature"]);
  });

  it("deleteRemoteBranch returns false on error", () => {
    mockGitThrow(new Error("rejected"));
    expect(git.deleteRemoteBranch("feature")).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("fastForwardBase checks out and pulls base branch", () => {
    mockGit("");
    expect(git.fastForwardBase("main")).toBe(true);
    expectGit(["checkout", "main"]);
    expectGit(["pull", "origin", "main", "--ff-only"]);
  });

  it("fastForwardBase returns false on error", () => {
    mockGitThrow(new Error("merge conflict"));
    expect(git.fastForwardBase("main")).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("checkoutBranch runs git checkout with argv", () => {
    mockGit("");
    git.checkoutBranch("feature; echo pwned");
    expectGit(["checkout", "feature; echo pwned"]);
  });

  it("remoteExists checks remote url", () => {
    mockGit("https://github.com/owner/repo.git\n");
    expect(git.remoteExists("origin")).toBe(true);
    expectGit(["remote", "get-url", "origin"]);
  });

  it("remoteExists returns false when remote is absent", () => {
    mockGitThrow(new Error("not found"));
    expect(git.remoteExists("fork")).toBe(false);
  });

  it("addRemote adds a remote with inherited stdio", () => {
    mockGit("");
    git.addRemote("fork", "https://github.com/fork/repo.git");

    expectGit(["remote", "add", "fork", "https://github.com/fork/repo.git"], {
      stdio: "inherit",
    });
  });

  it("pushToRemote pushes without force by default", () => {
    mockGit("");
    git.pushToRemote("origin", "feature", false);

    expectGit(["push", "origin", "HEAD:feature"], { stdio: "inherit" });
  });

  it("pushToRemote pushes with force-with-lease when force is true", () => {
    mockGit("");
    git.pushToRemote("origin", "feature; echo pwned", true);

    expectGit(
      ["push", "--force-with-lease", "origin", "HEAD:feature; echo pwned"],
      { stdio: "inherit" },
    );
  });

  it("branchExistsOnRemote returns true when remote has branch", () => {
    mockGit("abc123\trefs/heads/feature\n");
    expect(git.branchExistsOnRemote("origin", "feature")).toBe(true);
    expectGit(["ls-remote", "--heads", "origin", "refs/heads/feature"]);
  });

  it("branchExistsOnRemote returns false for empty output or errors", () => {
    mockGit("");
    expect(git.branchExistsOnRemote("origin", "feature")).toBe(false);

    mockGitThrow(new Error("not found"));
    expect(git.branchExistsOnRemote("origin", "feature")).toBe(false);
  });

  it("hasDiverged returns false when local is ancestor of remote", () => {
    mockGit("");
    expect(git.hasDiverged("feature", "origin/feature")).toBe(false);
    expectGit(["merge-base", "--is-ancestor", "origin/feature", "feature"]);
  });

  it("hasDiverged returns true when local has diverged", () => {
    mockGitThrow(new Error("not ancestor"));
    expect(git.hasDiverged("feature", "origin/feature")).toBe(true);
  });

  it("listBranches returns array of branch names", () => {
    mockGit("main\nfeature\nhotfix\n");
    expect(git.listBranches()).toEqual(["main", "feature", "hotfix"]);
    expectGit(["branch", "--format=%(refname:short)"]);
  });

  it("listBranches handles empty output", () => {
    mockGit("");
    expect(git.listBranches()).toEqual([]);
  });

  it("listDecorationsInAncestryPath uses argv for branch and excluded ref", () => {
    mockGit("HEAD -> feature\norigin/main\n");

    expect(
      git.listDecorationsInAncestryPath("feature; echo pwned", "origin/main"),
    ).toEqual(["HEAD -> feature", "origin/main"]);

    expectGit([
      "log",
      "--oneline",
      "--ancestry-path",
      "feature; echo pwned",
      "--not",
      "origin/main",
      "--simplify-by-decoration",
      "--format=%D",
    ]);
  });

  it("rebaseBranch checks out and rebases", () => {
    mockGit("");
    git.rebaseBranch("feature", "main");
    expectGit(["checkout", "feature"]);
    expectGit(["rebase", "main"]);
  });

  it("pushBranch pushes with force-with-lease and sets upstream", () => {
    mockGit("");
    git.pushBranch("feature");
    expectGit(["push", "-u", "origin", "feature", "--force-with-lease"]);
  });

  it("getAheadCount counts log lines without shell pipes", () => {
    mockGit("a first\nb second\n");
    expect(git.getAheadCount("feature", "main")).toBe(2);
    expectGit(["log", "--oneline", "main..feature"]);
  });

  it("commitChanges passes message as one argv value", () => {
    mockGit("");
    git.commitChanges('message"; echo pwned');
    expectGit(["commit", "-m", 'message"; echo pwned']);
  });

  it("tag commands pass tag names as argv", () => {
    mockGit("");
    git.createAnnotatedTag("release/1.0.0", "Release 1.0.0");
    git.pushTag("release/1.0.0");

    expectGit(["tag", "-a", "release/1.0.0", "-m", "Release 1.0.0"], {
      stdio: "inherit",
    });

    expectGit(["push", "origin", "release/1.0.0"], { stdio: "inherit" });
  });
});
