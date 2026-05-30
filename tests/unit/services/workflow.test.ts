import fs from "fs";
import os from "os";
import path from "path";

import git from "@/core/git";
import service from "@/services/workflow";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/git", () => ({
  default: {
    getRepoRoot: vi.fn(),
  },
}));

describe("workflow service", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ghg-workflow-test-"));
  const workflowsDir = path.join(tempRoot, ".github", "workflows");
  const workflowFile = path.join(workflowsDir, "ci.yml");

  beforeEach(() => {
    fs.mkdirSync(workflowsDir, { recursive: true });
    fs.writeFileSync(
      workflowFile,
      [
        "name: CI",
        "on:",
        "  push:",
        "jobs:",
        "  test:",
        "    runs-on: ubuntu-latest",
      ].join("\n"),
      "utf8",
    );

    vi.mocked(git.getRepoRoot).mockReturnValue(tempRoot);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("validates workflow files", async () => {
    const result = await service.validate();
    expect(result.success).toBe(true);
    expect(result.metadata).toHaveLength(1);
    expect(result.metadata[0].valid).toBe(true);
  });

  it("builds preview output", async () => {
    const result = await service.preview();
    expect(result.success).toBe(true);
    expect(result.metadata[0].jobs).toHaveLength(1);
    expect(result.metadata[0].jobs[0].id).toBe("test");
  });
});
