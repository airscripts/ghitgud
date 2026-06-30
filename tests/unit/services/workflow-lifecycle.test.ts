import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api/workflows";
import reposApi from "@/api/repos";
import service from "@/services/workflow";
import { emptyResponse, jsonResponse } from "../helpers/response";

vi.mock("@/api/workflows", () => ({
  default: {
    listWorkflows: vi.fn(),
    getWorkflow: vi.fn(),
    dispatchWorkflow: vi.fn(),
    setWorkflowEnabled: vi.fn(),
  },
}));

vi.mock("@/api/repos", () => ({
  default: { get: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

const workflow = (overrides: Record<string, unknown> = {}) => ({
  id: 12,
  name: "CI",
  path: ".github/workflows/ci.yml",
  state: "active",
  html_url: "https://github.com/owner/repo/actions/workflows/ci.yml",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

describe("workflow lifecycle service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters disabled workflows unless all is requested", async () => {
    const payload = {
      workflows: [workflow(), workflow({ id: 13, state: "disabled_manually" })],
    };
    vi.mocked(api.listWorkflows)
      .mockResolvedValueOnce(jsonResponse(payload))
      .mockResolvedValueOnce(jsonResponse(payload));
    expect((await service.list("owner/repo")).workflows).toHaveLength(1);
    expect(
      (await service.list("owner/repo", { all: true })).workflows,
    ).toHaveLength(2);
  });

  it("resolves a display name and dispatches on the default branch", async () => {
    vi.mocked(api.listWorkflows).mockResolvedValue(
      jsonResponse({ workflows: [workflow()] }),
    );
    vi.mocked(reposApi.get).mockResolvedValue({
      default_branch: "main",
    } as never);
    vi.mocked(api.dispatchWorkflow).mockResolvedValue(emptyResponse());

    const result = await service.run("CI", {
      repo: "owner/repo",
      fields: ["env=test"],
    });
    expect(result.ref).toBe("main");
    expect(api.dispatchWorkflow).toHaveBeenCalledWith(
      "owner/repo",
      "12",
      "main",
      { env: "test" },
    );
  });

  it("rejects ambiguous display names", async () => {
    vi.mocked(api.listWorkflows).mockResolvedValue(
      jsonResponse({ workflows: [workflow(), workflow({ id: 13 })] }),
    );
    await expect(service.view("CI", "owner/repo")).rejects.toThrow(
      "Multiple workflows",
    );
  });

  it("views filenames directly and changes enabled state", async () => {
    vi.mocked(api.getWorkflow).mockResolvedValue(jsonResponse(workflow()));
    vi.mocked(api.setWorkflowEnabled).mockResolvedValue(emptyResponse());
    const viewed = await service.view("ci.yml", "owner/repo");
    expect(viewed.workflow.id).toBe(12);
    await service.setEnabled("ci.yml", "owner/repo", true);
    await service.setEnabled("ci.yml", "owner/repo", false);
    expect(api.setWorkflowEnabled).toHaveBeenNthCalledWith(
      1,
      "owner/repo",
      "ci.yml",
      true,
    );
  });

  it("validates dispatch fields", async () => {
    await expect(
      service.run("ci.yml", {
        repo: "owner/repo",
        ref: "main",
        fields: ["bad"],
      }),
    ).rejects.toThrow("Invalid workflow field");
    await expect(
      service.run("ci.yml", {
        repo: "owner/repo",
        ref: "main",
        fields: ["env=a", "env=b"],
      }),
    ).rejects.toThrow("Duplicate or empty");
    await expect(
      service.run("ci.yml", {
        repo: "owner/repo",
        ref: "main",
        fields: Array.from({ length: 26 }, (_, index) => `field${index}=x`),
      }),
    ).rejects.toThrow("at most 25");
  });

  it("rejects a missing display name", async () => {
    vi.mocked(api.listWorkflows).mockResolvedValue(
      jsonResponse({ workflows: [] }),
    );
    await expect(service.view("Missing", "owner/repo")).rejects.toThrow(
      "Workflow not found",
    );
  });
});
