import api from "@/api/milestones";
import output from "@/core/output";
import logger from "@/core/logger";
import milestoneService from "@/services/milestone";
import { describe, it, expect, vi, Mock, beforeEach } from "vitest";

vi.mock("@/api/milestones", () => ({
  default: {
    list: vi.fn(),
    close: vi.fn(),
    create: vi.fn(),
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
  },
}));

const MILESTONE = {
  id: 1,
  number: 7,
  state: "open",
  open_issues: 2,
  title: "v2.10.0",
  closed_issues: 6,
  due_on: "2026-06-30T00:00:00Z",
  html_url: "https://github.com/owner/repo/milestone/7",
  url: "https://api.github.com/repos/owner/repo/milestones/7",
};

describe("milestone service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates milestones with normalized due date", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve(MILESTONE),
    });

    const result = await milestoneService.create("owner/repo", {
      title: "v2.10.0",
      due: "2026-06-30",
    });

    expect(api.create).toHaveBeenCalledWith(
      {
        title: "v2.10.0",
        dueOn: "2026-06-30T00:00:00.000Z",
      },
      "owner/repo",
    );

    expect(result).toEqual({ success: true, milestone: MILESTONE });
    expect(logger.success).toHaveBeenCalledWith('Created milestone "v2.10.0".');
  });

  it("computes milestone progress", async () => {
    (api.list as Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve([MILESTONE]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    const result = await milestoneService.progress("owner/repo", "v2.10.0");

    expect(result).toEqual({
      success: true,

      metadata: {
        total: 8,
        percent: 75,
        openIssues: 2,
        closedIssues: 6,
        title: "v2.10.0",
      },
    });
  });

  it("closes milestones by exact title", async () => {
    (api.list as Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve([MILESTONE]) })
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    (api.close as Mock).mockResolvedValue({
      json: () => Promise.resolve({ ...MILESTONE, state: "closed" }),
    });

    await milestoneService.close("owner/repo", "v2.10.0");
    expect(api.close).toHaveBeenCalledWith(7, "owner/repo");
  });

  it("throws when milestone is missing", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });

    await expect(
      milestoneService.progress("owner/repo", "missing"),
    ).rejects.toThrow('Milestone "missing" was not found.');

    expect(output.renderSummary).not.toHaveBeenCalled();
  });
});
