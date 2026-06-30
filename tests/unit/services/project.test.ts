import api from "@/api/projects";
import projectService from "@/services/project";
import { describe, expect, it, Mock, vi, beforeEach } from "vitest";

vi.mock("@/api/projects", () => ({
  default: {
    board: vi.fn(),
    owner: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    issue: vi.fn(),
    addItem: vi.fn(),
    createItem: vi.fn(),
    repository: vi.fn(),
    link: vi.fn(),
    unlink: vi.fn(),
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
    success: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
    renderSection: vi.fn(),
    renderTable: vi.fn(),
    renderKeyValues: vi.fn(),
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

    const result = await projectService.board("1", { repo: "owner/repo" });

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
    expect(api.board).toHaveBeenCalledWith("alice", 2);
  });

  it("lists and creates projects for an organization", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "ORG", login: "acme" },
            user: null,
          },
        }),
    });
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectsV2: {
                nodes: [
                  {
                    id: "P1",
                    number: 1,
                    title: "Roadmap",
                    shortDescription: "Work",
                    closed: false,
                    url: "https://example.test/p/1",
                  },
                ],
              },
            },
          },
        }),
    });
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            createProjectV2: {
              projectV2: {
                id: "P2",
                number: 2,
                title: "New",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/2",
              },
            },
          },
        }),
    });

    const listed = await projectService.list({ owner: "acme", limit: 10 });
    expect(listed.projects).toHaveLength(1);
    const created = await projectService.create("New", { owner: "acme" });
    expect(created.project.number).toBe(2);
  });

  it("validates project limits and identifiers", async () => {
    await expect(projectService.list({ limit: 0 })).rejects.toThrow(
      "between 1 and 100",
    );
    await expect(projectService.view("bad", { owner: "acme" })).rejects.toThrow(
      "Invalid project id",
    );
    await expect(projectService.create("   ", {})).rejects.toThrow(
      "title is required",
    );
    await expect(projectService.itemList("1", { limit: 101 })).rejects.toThrow(
      "between 1 and 100",
    );
  });

  it("reports unresolved owners and GraphQL errors", async () => {
    (api.owner as Mock).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          data: { viewer: { login: "alice" }, organization: null, user: null },
        }),
    });
    await expect(
      projectService.list({ owner: "missing", limit: 10 }),
    ).rejects.toThrow("Project owner not found");

    (api.board as Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ errors: [{ message: "Denied" }] }),
    });
    await expect(projectService.board("1", { owner: "alice" })).rejects.toThrow(
      "Denied",
    );
  });

  it("lists project items and fields", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: null,
            user: { id: "U1", login: "alice" },
          },
        }),
    });
    const project = {
      id: "P1",
      number: 1,
      title: "Roadmap",
      shortDescription: "",
      closed: false,
      url: "https://example.test/p/1",
      items: {
        nodes: [
          {
            id: "I1",
            type: "ISSUE",
            content: {
              number: 2,
              title: "Task",
              state: "OPEN",
              url: "https://example.test/i/2",
              repository: { nameWithOwner: "owner/repo" },
            },
            fieldValueByName: { name: "Todo" },
          },
        ],
      },
      fields: {
        nodes: [{ id: "F1", name: "Status", dataType: "SINGLE_SELECT" }],
      },
    };
    (api.get as Mock).mockImplementation(() => ({
      json: () =>
        Promise.resolve({
          data: { organization: null, user: { projectV2: project } },
        }),
    }));
    expect(
      (await projectService.itemList("1", { owner: "alice", limit: 10 })).items,
    ).toHaveLength(1);
    expect(
      (await projectService.fieldList("1", { owner: "alice" })).fields,
    ).toHaveLength(1);
  });
});
