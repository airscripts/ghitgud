import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import templateService from "@/services/template";

vi.mock("@/api/templates", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    listPrTemplates: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import api from "@/api/templates";

describe("template service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists templates with no templates directory", async () => {
    (api.list as Mock).mockRejectedValue(new Error("Not found"));
    (api.listPrTemplates as Mock).mockRejectedValue(new Error("Not found"));
    const result = await templateService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.templates).toHaveLength(0);
  });

  it("lists templates with issue templates", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            name: "bug_report.md",
            path: ".github/ISSUE_TEMPLATE/bug_report.md",
            type: "file",
          },
        ]),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          content: Buffer.from(
            "---\nname: Bug Report\nabout: Report a bug\nlabels: bug\n---\n\nBody text",
          ).toString("base64"),
        }),
    });
    (api.listPrTemplates as Mock).mockRejectedValue(new Error("Not found"));
    const result = await templateService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.templates.length).toBeGreaterThanOrEqual(1);
  });

  it("lists templates with issue template that fails to load", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            name: "bug.md",
            path: ".github/ISSUE_TEMPLATE/bug.md",
            type: "file",
          },
        ]),
    });
    (api.get as Mock).mockRejectedValue(new Error("Not found"));
    (api.listPrTemplates as Mock).mockRejectedValue(new Error("Not found"));
    const result = await templateService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.templates[0].content).toBeNull();
  });

  it("lists templates with PR template", async () => {
    (api.list as Mock).mockRejectedValue(new Error("Not found"));
    (api.listPrTemplates as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            name: "pull_request_template.md",
            path: ".github/pull_request_template.md",
            type: "file",
          },
        ]),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          content: Buffer.from("PR template content").toString("base64"),
        }),
    });
    const result = await templateService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    const prTemplate = result.templates.find(
      (t) => t.name === "Pull Request Template",
    );
    expect(prTemplate).toBeDefined();
  });

  it("lists templates with PR template that fails to load", async () => {
    (api.list as Mock).mockRejectedValue(new Error("Not found"));
    (api.listPrTemplates as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            name: "pull_request_template.md",
            path: ".github/pull_request_template.md",
            type: "file",
          },
        ]),
    });
    (api.get as Mock).mockRejectedValue(new Error("Not found"));
    const result = await templateService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    const prTemplate = result.templates.find(
      (t) => t.name === "Pull Request Template",
    );
    expect(prTemplate?.content).toBeNull();
  });

  it("shows a template", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          content: Buffer.from(
            "---\nname: Bug\nabout: Report\n---\n\nBody",
          ).toString("base64"),
          name: "bug_report.md",
          path: ".github/ISSUE_TEMPLATE/bug_report.md",
        }),
    });
    const result = await templateService.show("bug_report.md", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });

  it("shows a template with .github/ prefix already in name", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          content: Buffer.from("Template content").toString("base64"),
          name: "bug_report.md",
          path: ".github/ISSUE_TEMPLATE/bug_report.md",
        }),
    });
    const result = await templateService.show(
      ".github/ISSUE_TEMPLATE/bug_report.md",
      { repo: "owner/repo" },
    );
    expect(result.success).toBe(true);
    expect(api.get).toHaveBeenCalledWith(
      "owner/repo",
      ".github/ISSUE_TEMPLATE/bug_report.md",
    );
  });

  it("uses repo resolver when repo not provided", async () => {
    (api.list as Mock).mockRejectedValue(new Error("Not found"));
    (api.listPrTemplates as Mock).mockRejectedValue(new Error("Not found"));
    const result = await templateService.list();
    expect(result.success).toBe(true);
  });
});
