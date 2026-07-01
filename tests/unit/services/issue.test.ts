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
    comment: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    delete: vi.fn(),
    pin: vi.fn(),
    unpin: vi.fn(),
    pinState: vi.fn(),
    transfer: vi.fn(),
    repository: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn() },
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

  it("requires title when creating a sub-issue", async () => {
    await expect(
      issueService.subtasks("owner/repo", "1", { create: true }),
    ).rejects.toThrow("--title is required");
  });

  it("rejects invalid issue number", async () => {
    await expect(issueService.view("owner/repo", "0")).rejects.toThrow(
      "Invalid issue number",
    );
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

  it("throws when issue type not found", async () => {
    (api.issueTypes as Mock).mockResolvedValue({
      json: () => Promise.resolve([{ name: "Bug" }]),
    });

    await expect(
      issueService.create("owner/repo", {
        title: "Broken",
        type: "nonexistent",
      }),
    ).rejects.toThrow("was not found");
  });

  it("throws when issue type is ambiguous", async () => {
    (api.issueTypes as Mock).mockResolvedValue({
      json: () => Promise.resolve([{ name: "Bug" }, { name: "bug" }]),
    });

    await expect(
      issueService.create("owner/repo", {
        title: "Broken",
        type: "Bug",
      }),
    ).rejects.toThrow("was not found");
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

  it("rejects list limit over 100", async () => {
    await expect(
      issueService.list("owner/repo", { limit: 101 }),
    ).rejects.toThrow("cannot exceed 100");
  });

  it("views an issue with pinned state", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          number: 5,
          title: "Bug",
          state: "open",
          body: "Details",
          locked: true,
          node_id: "N1",
        }),
    });
    (api.pinState as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { repository: { issue: { isPinned: true } } },
        }),
    });

    const result = await issueService.view("owner/repo", "5");
    expect(result.issue.isPinned).toBe(true);
    expect(result.issue.locked).toBe(true);
  });

  it("views an issue with no body", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          number: 5,
          title: "Bug",
          state: "open",
          body: "",
          node_id: "N1",
        }),
    });
    (api.pinState as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { repository: { issue: { isPinned: false } } },
        }),
    });

    const result = await issueService.view("owner/repo", "5");
    expect(result.issue.isPinned).toBe(false);
  });

  it("edits with both body and title", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 1, title: "Updated" }),
    });

    await issueService.edit("owner/repo", 1, {
      title: "Updated",
      body: "New body",
    });
    expect(api.update).toHaveBeenCalledWith(
      1,
      { title: "Updated", body: "New body" },
      "owner/repo",
    );
  });

  it("rejects both body and removeBody", async () => {
    await expect(
      issueService.edit("owner/repo", 1, {
        body: "text",
        removeBody: true,
      }),
    ).rejects.toThrow("Use either --body or --remove-body");
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

  it("closes an issue", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 3, state: "closed" }),
    });

    const result = await issueService.close("owner/repo", "3");
    expect(result.success).toBe(true);
    expect(api.update).toHaveBeenCalledWith(
      3,
      { state: "closed" },
      "owner/repo",
    );
  });

  it("reopens an issue", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 3, state: "open" }),
    });

    const result = await issueService.reopen("owner/repo", "3");
    expect(result.success).toBe(true);
    expect(api.update).toHaveBeenCalledWith(3, { state: "open" }, "owner/repo");
  });

  it("comments on an issue", async () => {
    (api.comment as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: "C1", body: "Nice" }),
    });

    const result = await issueService.comment("owner/repo", "5", "Nice");
    expect(result.success).toBe(true);
    expect(result.comment).toEqual({ id: "C1", body: "Nice" });
  });

  it("locks an issue", async () => {
    (api.lock as Mock).mockResolvedValue({ ok: true });

    const result = await issueService.lock("owner/repo", "5");
    expect(result.success).toBe(true);
    expect(result.metadata.locked).toBe(true);
    expect(api.lock).toHaveBeenCalledWith(5, "owner/repo");
  });

  it("unlocks an issue", async () => {
    (api.unlock as Mock).mockResolvedValue({ ok: true });

    const result = await issueService.unlock("owner/repo", "5");
    expect(result.success).toBe(true);
    expect(result.metadata.locked).toBe(false);
    expect(api.unlock).toHaveBeenCalledWith(5, "owner/repo");
  });

  it("deletes an issue by node id", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ number: 7, node_id: "NID7", title: "Gone" }),
    });
    (api.delete as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await issueService.delete("owner/repo", "7");
    expect(result.success).toBe(true);
    expect(api.delete).toHaveBeenCalledWith("NID7");
  });

  it("pins an issue", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ number: 8, node_id: "NID8", title: "Pinned" }),
    });
    (api.pin as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await issueService.pin("owner/repo", "8");
    expect(result.success).toBe(true);
    expect(api.pin).toHaveBeenCalledWith("NID8");
  });

  it("unpins an issue", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ number: 9, node_id: "NID9", title: "Unpinned" }),
    });
    (api.unpin as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await issueService.unpin("owner/repo", "9");
    expect(result.success).toBe(true);
    expect(api.unpin).toHaveBeenCalledWith("NID9");
  });

  it("throws when deleting an issue without node id", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 7, title: "NoNode" }),
    });

    await expect(issueService.delete("owner/repo", "7")).rejects.toThrow(
      "does not include a node id",
    );
  });

  it("transfers an issue to another repo", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          number: 10,
          node_id: "NID10",
          title: "Transfer",
        }),
    });
    (api.repository as Mock).mockResolvedValue({
      json: () => Promise.resolve({ node_id: "RID1" }),
    });
    (api.transfer as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            transferIssue: {
              issue: { number: 10, title: "Transfer", url: "http://x" },
            },
          },
        }),
    });

    const result = await issueService.transfer(
      "owner/repo",
      "10",
      "other/repo",
    );
    expect(result.success).toBe(true);
    expect(api.transfer).toHaveBeenCalledWith("NID10", "RID1");
  });

  it("throws when transfer target repo has no node id", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          number: 10,
          node_id: "NID10",
          title: "Transfer",
        }),
    });
    (api.repository as Mock).mockResolvedValue({
      json: () => Promise.resolve({}),
    });

    await expect(
      issueService.transfer("owner/repo", "10", "other/repo"),
    ).rejects.toThrow("does not include a node id");
  });

  it("throws when transfer returns no issue", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          number: 10,
          node_id: "NID10",
          title: "Transfer",
        }),
    });
    (api.repository as Mock).mockResolvedValue({
      json: () => Promise.resolve({ node_id: "RID1" }),
    });
    (api.transfer as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: { transferIssue: { issue: null } } }),
    });

    await expect(
      issueService.transfer("owner/repo", "10", "other/repo"),
    ).rejects.toThrow("Transfer did not return an issue");
  });

  it("loads issue status with deduplication", async () => {
    const issue1 = { id: 1, number: 1, title: "One", state: "open" };
    (api.status as Mock).mockImplementation(() => ({
      json: () => Promise.resolve({ items: [issue1] }),
    }));

    const result = await issueService.status("owner/repo");
    expect(result.success).toBe(true);
    expect(api.status).toHaveBeenCalledTimes(3);
  });

  it("lists issues with labels and assignees", async () => {
    const items = [
      {
        number: 1,
        title: "One",
        state: "open",
        labels: [{ name: "bug" }, { name: "urgent" }],
        assignees: [{ login: "alice" }],
        type: { name: "Bug" },
        updated_at: "2024-01-01",
        user: { login: "bob" },
      },
    ];
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ items }),
    });

    const result = await issueService.list("owner/repo", { limit: 10 });
    expect(result.issues).toHaveLength(1);
  });

  it("handles issues with string labels and missing fields", async () => {
    const items = [
      {
        number: 1,
        title: "One",
        state: "open",
        labels: ["bug"],
        assignees: [],
        type: "Task",
      },
    ];
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ items }),
    });

    const result = await issueService.list("owner/repo", { limit: 10 });
    expect(result.issues).toHaveLength(1);
  });

  it("links a parent issue via parent method", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 50, number: 2, title: "Child" }),
    });
    (api.addSubIssue as Mock).mockResolvedValue({ ok: true });

    const result = await issueService.parent("owner/repo", "2", {
      parent: "1",
    });
    expect(result.success).toBe(true);
    expect(api.addSubIssue).toHaveBeenCalledWith(1, 50, "owner/repo");
  });

  it("requires parent option for parent command", async () => {
    await expect(issueService.parent("owner/repo", "2", {})).rejects.toThrow(
      "--parent is required",
    );
  });

  it("throws when linking sub-issue without api id", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 2, title: "Child" }),
    });

    await expect(
      issueService.subtasks("owner/repo", "1", { link: "2" }),
    ).rejects.toThrow("does not include an API id");
  });

  it("throws when created sub-issue has no number", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve({ title: "No number" }),
    });

    await expect(
      issueService.subtasks("owner/repo", "1", {
        create: true,
        title: "Test",
      }),
    ).rejects.toThrow("did not include a number");
  });

  it("lists issue types", async () => {
    (api.issueTypes as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            name: "Bug",
            color: "ff0000",
            description: "Something isn't working",
          },
          {
            name: "Feature",
            color: "00ff00",
            description: "New feature request",
          },
        ]),
    });

    const result = await issueService.typeList({ repo: "owner/repo" });
    expect(api.issueTypes).toHaveBeenCalledWith("owner/repo");
    expect(result.types).toHaveLength(2);
    expect(result.success).toBe(true);
  });

  it("skips type resolution when no type requested", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 1, title: "NoType" }),
    });

    await issueService.create("owner/repo", { title: "NoType" });
    expect(api.issueTypes).not.toHaveBeenCalled();
    expect(api.create).toHaveBeenCalledWith(
      { title: "NoType", type: undefined },
      "owner/repo",
    );
  });
});
