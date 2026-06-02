import api from "@/api/projects";
import config from "@/core/config";
import projectService from "@/services/project";
import { describe, expect, it, Mock, vi, beforeEach } from "vitest";

vi.mock("@/api/projects", () => ({
  default: {
    board: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    getRepo: vi.fn(() => "owner/repo"),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
    renderSection: vi.fn(),
  },
}));

describe("project service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups project items by status", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                title: "Sprint",

                items: {
                  nodes: [
                    {
                      content: {
                        number: 1,
                        state: "OPEN",
                        title: "Build it",
                        __typename: "Issue",
                        url: "https://github.com/owner/repo/issues/1",
                      },

                      fieldValueByName: { name: "Todo" },
                    },

                    {
                      content: {
                        title: "Draft task",
                      },

                      fieldValueByName: null,
                    },
                  ],
                },
              },
            },
          },
        }),
    });

    const result = await projectService.board("1", {});

    expect(api.board).toHaveBeenCalledWith("owner", 1);
    expect(result.board.columns).toEqual([
      {
        name: "Todo",

        items: [
          {
            number: 1,
            state: "OPEN",
            type: "Issue",
            title: "Build it",
            url: "https://github.com/owner/repo/issues/1",
          },
        ],
      },

      {
        name: "No Status",

        items: [
          {
            type: "Draft",
            url: undefined,
            state: undefined,
            number: undefined,
            title: "Draft task",
          },
        ],
      },
    ]);
  });

  it("uses explicit project owner", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            user: {
              projectV2: {
                title: "Personal",
                items: { nodes: [] },
              },
            },
          },
        }),
    });

    await projectService.board("2", { owner: "alice" });
    expect(config.getRepo).not.toHaveBeenCalled();
    expect(api.board).toHaveBeenCalledWith("alice", 2);
  });
});
