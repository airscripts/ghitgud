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

  it("validates workflow with missing name warning", async () => {
    fs.writeFileSync(
      workflowFile,
      ["on:", "  push:", "jobs:", "  test:", "    runs-on: ubuntu-latest"].join(
        "\n",
      ),
      "utf8",
    );

    const result = await service.validate();
    expect(result.metadata[0].valid).toBe(true);

    expect(result.metadata[0].issues).toContainEqual(
      expect.objectContaining({
        level: "warning",
        rule: "workflow-name",
      }),
    );
  });

  it("fails validation for missing on trigger", async () => {
    fs.writeFileSync(
      workflowFile,
      ["name: CI", "jobs:", "  test:", "    runs-on: ubuntu-latest"].join("\n"),
      "utf8",
    );

    await expect(service.validate()).rejects.toThrow(
      "Workflow validation failed.",
    );
  });

  it("fails validation for tabs in yaml", async () => {
    fs.writeFileSync(
      workflowFile,
      [
        "name: CI",
        "on:",
        "  push:",
        "jobs:",
        "  test:",
        "\truns-on: ubuntu-latest",
      ].join("\n"),
      "utf8",
    );

    await expect(service.validate()).rejects.toThrow(
      "Workflow validation failed.",
    );
  });

  it("fails validation for invalid yaml syntax", async () => {
    fs.writeFileSync(
      workflowFile,
      ["name: CI", "on:", "  push:", "jobs:", "  test: [invalid"].join("\n"),
      "utf8",
    );

    await expect(service.validate()).rejects.toThrow(
      "Workflow validation failed.",
    );
  });

  it("builds preview with unresolved expressions", async () => {
    fs.writeFileSync(
      workflowFile,
      [
        "name: CI",
        "on:",
        "  push:",
        "jobs:",
        "  test:",
        "    runs-on: ${{ matrix.os }}",
      ].join("\n"),
      "utf8",
    );

    const result = await service.preview();
    expect(result.metadata[0].unresolvedExpressions).toContain(
      "${{ matrix.os }}",
    );
  });

  it("builds preview with matrix", async () => {
    fs.writeFileSync(
      workflowFile,
      [
        "name: CI",
        "on:",
        "  push:",
        "jobs:",
        "  test:",
        "    runs-on: ubuntu-latest",
        "    strategy:",
        "      matrix:",
        "        node: [18, 20]",
      ].join("\n"),
      "utf8",
    );

    const result = await service.preview();
    expect(result.metadata[0].jobs[0].matrix).toContain("node=[18, 20]");
  });

  it("throws when workflow directory missing", async () => {
    fs.rmSync(workflowsDir, { recursive: true, force: true });
    await expect(service.validate()).rejects.toThrow(
      "No workflow files were found",
    );
  });

  it("throws when specific path does not exist", async () => {
    await expect(service.validate("/nonexistent/path.yml")).rejects.toThrow(
      "No workflow files were found",
    );
  });
});
