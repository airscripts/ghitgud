import { execFile } from "child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

import config from "@/core/config";
import wikiGit from "@/core/wiki-git";

vi.mock("child_process", () => ({
  execFile: vi.fn((_cmd, _args, _opts, cb) => cb(null, "", "")),
}));

vi.mock("@/core/config", () => ({
  default: { getToken: vi.fn(() => "secret-token") },
}));

describe("wiki git", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clones with ephemeral header authentication and cleans up", async () => {
    const result = await wikiGit.withClone("owner/repo", async (directory) => {
      expect(directory).toContain("gitfleet-wiki-");
      return "done";
    });

    expect(result).toBe("done");
    expect(config.getToken).toHaveBeenCalled();
    const call = vi.mocked(execFile).mock.calls[0];

    expect(call[1]).toEqual([
      "clone",
      "https://github.com/owner/repo.wiki.git",
      expect.stringContaining("gitfleet-wiki-"),
    ]);

    expect(call[1]?.join(" ")).not.toContain("secret-token");
    const options = call[2] as { env: NodeJS.ProcessEnv };
    expect(options.env.GIT_CONFIG_KEY_0).toBe("http.extraHeader");
    expect(options.env.GIT_CONFIG_VALUE_0).not.toContain("secret-token");
    expect(options.env.GIT_TERMINAL_PROMPT).toBe("0");
  });

  it("stages, commits, and pushes", async () => {
    await wikiGit.commitAndPush("/tmp/wiki", "docs: update wiki page Home");
    expect(vi.mocked(execFile).mock.calls.map((call) => call[1])).toEqual([
      ["add", "-A"],
      ["commit", "-m", "docs: update wiki page Home"],
      ["push", "origin", "HEAD"],
    ]);
  });
});
