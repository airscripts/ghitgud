import api from "@/api/issues";
import issueService from "@/services/issue";
import { describe, expect, it, Mock, vi, beforeEach } from "vitest";

vi.mock("@/api/issues", () => ({
  default: {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    status: vi.fn(),
    issueTypes: vi.fn(),
    addSubIssue: vi.fn(),
    listSubIssues: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    renderSection: vi.fn(),
  },
}));

describe("issue service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists sub-issues", async () => {
    const subIssues = [{ number: 2, title: "Child", state: "open" }];
    (api.listSubIssues as Mock).mockResolvedValue({
      json: () => Promise.resolve(subIssues),
    });

    const result = await issueService.subtasks("owner/repo", "1");
    expect(api.listSubIssues).toHaveBeenCalledWith(1, "owner/repo");
    expect(result).toEqual({ success: true, subIssues });
  });

  it("links an existing child issue by resolved API id", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 99, number: 2, title: "Child" }),
    });

    const result = await issueService.subtasks("owner/repo", "1", {
      link: "2",
    });

    expect(api.addSubIssue).toHaveBeenCalledWith(1, 99, "owner/repo");
    expect(result).toEqual({
      success: true,

      metadata: {
        child: 2,
        parent: 1,
      },
    });
  });

  it("creates and links a new child issue", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 3, title: "New child" }),
    });

    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 100, number: 3, title: "New child" }),
    });

    await issueService.subtasks("owner/repo", "1", {
      create: true,
      title: "New child",
    });

    expect(api.create).toHaveBeenCalledWith(
      {
        body: undefined,
        title: "New child",
      },
      "owner/repo",
    );

    expect(api.addSubIssue).toHaveBeenCalledWith(1, 100, "owner/repo");
  });

  it("rejects conflicting create and link options", async () => {
    await expect(
      issueService.subtasks("owner/repo", "1", { create: true, link: "2" }),
    ).rejects.toThrow("Use either --create or --link, not both.");
  });

  it("creates an issue with a case-insensitive resolved type", async () => {
    (api.issueTypes as Mock).mockResolvedValue({
      json: () => Promise.resolve([{ name: "Bug" }, { name: "Task" }]),
    });

    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 4, title: "Broken" }),
    });

    await issueService.create("owner/repo", {
      title: "Broken",
      type: "bug",
      labels: ["urgent"],
    });

    expect(api.create).toHaveBeenCalledWith(
      {
        title: "Broken",
        type: "Bug",
        labels: ["urgent"],
      },

      "owner/repo",
    );
  });

  it("lists normalized search results", async () => {
    const items = [{ number: 1, title: "One", state: "open" }];
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ items }),
    });

    await expect(
      issueService.list("owner/repo", { state: "open", limit: 10 }),
    ).resolves.toEqual({ success: true, issues: items });
  });

  it("validates edit options and clears the body explicitly", async () => {
    await expect(issueService.edit("owner/repo", 1, {})).rejects.toThrow(
      "Provide --title, --body, or --remove-body.",
    );

    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 1, title: "One", body: "" }),
    });

    await issueService.edit("owner/repo", 1, { removeBody: true });
    expect(api.update).toHaveBeenCalledWith(1, { body: "" }, "owner/repo");
  });
});
