import api from "@/api/issues";
import issueService from "@/services/issue";
import { describe, expect, it, Mock, vi, beforeEach } from "vitest";

vi.mock("@/api/issues", () => ({
  default: {
    get: vi.fn(),
    create: vi.fn(),
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
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
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

    const result = await issueService.subtasks("1");
    expect(api.listSubIssues).toHaveBeenCalledWith(1);
    expect(result).toEqual({ success: true, subIssues });
  });

  it("links an existing child issue by resolved API id", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 99, number: 2, title: "Child" }),
    });

    const result = await issueService.subtasks("1", { link: "2" });

    expect(api.addSubIssue).toHaveBeenCalledWith(1, 99);
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

    await issueService.subtasks("1", {
      create: true,
      title: "New child",
    });

    expect(api.create).toHaveBeenCalledWith({
      body: undefined,
      title: "New child",
    });

    expect(api.addSubIssue).toHaveBeenCalledWith(1, 100);
  });

  it("rejects conflicting create and link options", async () => {
    await expect(
      issueService.subtasks("1", { create: true, link: "2" }),
    ).rejects.toThrow("Use either --create or --link, not both.");
  });
});
