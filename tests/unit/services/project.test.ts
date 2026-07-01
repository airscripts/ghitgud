import api from "@/api/projects";
import output from "@/core/output";
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

  it("renders empty board with no columns", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                title: "Empty",
                items: { nodes: [] },
              },
            },
          },
        }),
    });

    const result = await projectService.board("1", { owner: "acme" });
    expect(result.board.columns).toEqual([]);
    expect(output.log).toHaveBeenCalledWith("No project items found.");
  });

  it("renders empty column with dash", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                title: "Board",
                items: {
                  nodes: [
                    {
                      content: { title: "Task", type: "Issue", state: "OPEN" },
                      fieldValueByName: { name: "Done" },
                    },
                  ],
                },
              },
            },
          },
        }),
    });

    await projectService.board("1", { owner: "acme" });
  });

  it("skips items with no title in board", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                title: "Board",
                items: {
                  nodes: [
                    { content: null, fieldValueByName: null },
                    {
                      content: { title: "Valid" },
                      fieldValueByName: { name: "Todo" },
                    },
                  ],
                },
              },
            },
          },
        }),
    });

    const result = await projectService.board("1", { owner: "acme" });
    expect(result.board.columns).toHaveLength(1);
    expect(result.board.columns[0].items[0].title).toBe("Valid");
  });

  it("detects content type from __typename and number", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                title: "Board",
                items: {
                  nodes: [
                    {
                      content: {
                        title: "PR",
                        __typename: "PullRequest",
                      },
                      fieldValueByName: { name: "In Progress" },
                    },
                    {
                      content: { title: "NoType", number: 5 },
                      fieldValueByName: { name: "In Progress" },
                    },
                  ],
                },
              },
            },
          },
        }),
    });

    const result = await projectService.board("1", { owner: "acme" });
    expect(result.board.columns[0].items[0].type).toBe("PullRequest");
    expect(result.board.columns[0].items[1].type).toBe("Issue");
  });

  it("throws on invalid board project id", async () => {
    await expect(projectService.board("0", { owner: "acme" })).rejects.toThrow(
      "Invalid project id",
    );
  });

  it("throws when board project not found", async () => {
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { organization: null, user: null },
        }),
    });

    await expect(projectService.board("1", { owner: "acme" })).rejects.toThrow(
      "was not found",
    );
  });

  it("resolves viewer owner when no explicit owner", async () => {
    (api.owner as Mock)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: { viewer: { login: "bob" }, organization: null, user: null },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: {
              viewer: { login: "bob" },
              user: { id: "U2", login: "bob" },
            },
          }),
      });
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { user: { projectsV2: { nodes: [] } } },
        }),
    });

    const result = await projectService.list({ limit: 10 });
    expect(result.success).toBe(true);
  });

  it("throws when viewer has no login", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { viewer: {}, organization: null, user: null },
        }),
    });

    await expect(projectService.list({ limit: 10 })).rejects.toThrow(
      "Could not resolve project owner",
    );
  });

  it("throws when viewer lookup fails", async () => {
    (api.owner as Mock)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: { viewer: { login: "bob" }, organization: null, user: null },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            data: { viewer: { login: "bob" }, user: null },
          }),
      });

    await expect(projectService.list({ limit: 10 })).rejects.toThrow(
      "Could not resolve project owner",
    );
  });

  it("views a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "Desc",
                closed: true,
                url: "https://example.test/p/1",
                updatedAt: "2024-01-01",
              },
            },
          },
        }),
    });

    const result = await projectService.view("1", { owner: "acme" });
    expect(result.project.closed).toBe(true);
    expect(result.project.updatedAt).toBe("2024-01-01");
  });

  it("edits a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Old",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });
    (api.update as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            updateProjectV2: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "New",
                shortDescription: "Updated",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });

    const result = await projectService.edit("1", {
      owner: "acme",
      title: "New",
      description: "Updated",
    });
    expect(result.project.title).toBe("New");
  });

  it("closes a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await projectService.close("1", { owner: "acme" });
    expect(result.closed).toBe(true);
  });

  it("deletes a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });
    (api.delete as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await projectService.remove("1", { owner: "acme" });
    expect(result.success).toBe(true);
  });

  it("adds an item to a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: { id: "P1", number: 1 },
            },
          },
        }),
    });
    (api.issue as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            repository: { issue: { id: "ISSUE1" } },
          },
        }),
    });
    (api.addItem as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            addProjectV2ItemById: { item: { id: "ITEM1" } },
          },
        }),
    });

    const result = await projectService.itemAdd("1", 5, {
      owner: "acme",
      repo: "acme/repo",
    });
    expect(result.itemId).toBe("ITEM1");
  });

  it("throws when issue not found for item add", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: { id: "P1", number: 1 },
            },
          },
        }),
    });
    (api.issue as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { repository: { issue: null } },
        }),
    });

    await expect(
      projectService.itemAdd("1", 99, { owner: "acme", repo: "acme/repo" }),
    ).rejects.toThrow("was not found");
  });

  it("creates a draft item in a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: { id: "P1", number: 1 },
            },
          },
        }),
    });
    (api.createItem as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            addProjectV2DraftIssue: { projectItem: { id: "DI1" } },
          },
        }),
    });

    const result = await projectService.itemCreate("1", {
      owner: "acme",
      title: "Draft task",
      body: "Description",
    });
    expect(result.itemId).toBe("DI1");
  });

  it("lists fields filtering out empty ones", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
                fields: {
                  nodes: [
                    { id: "F1", name: "Status", dataType: "SINGLE_SELECT" },
                    { id: "", name: "", dataType: "TITLE" },
                  ],
                },
              },
            },
          },
        }),
    });

    const result = await projectService.fieldList("1", { owner: "acme" });
    expect(result.fields).toHaveLength(1);
  });

  it("links a repository to a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });
    (api.repository as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: { repository: { id: "R1" } } }),
    });
    (api.link as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await projectService.setLinked(
      "1",
      "acme/repo",
      {
        owner: "acme",
      },
      true,
    );
    expect(result.linked).toBe(true);
  });

  it("unlinks a repository from a project", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });
    (api.repository as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: { repository: { id: "R1" } } }),
    });
    (api.unlink as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: {} }),
    });

    const result = await projectService.setLinked(
      "1",
      "acme/repo",
      {
        owner: "acme",
      },
      false,
    );
    expect(result.linked).toBe(false);
    expect(api.unlink).toHaveBeenCalledWith("P1", "R1");
  });

  it("throws when repository not found for link", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
              },
            },
          },
        }),
    });
    (api.repository as Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: { repository: null } }),
    });

    await expect(
      projectService.setLinked("1", "missing/repo", { owner: "acme" }, true),
    ).rejects.toThrow("Repository not found");
  });

  it("normalizes projects with updatedAt", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
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
                    shortDescription: "",
                    closed: false,
                    url: "https://example.test/p/1",
                    updatedAt: "2024-06-01",
                  },
                ],
              },
            },
          },
        }),
    });

    const result = await projectService.list({ owner: "acme", limit: 10 });
    expect(result.projects[0].updatedAt).toBe("2024-06-01");
  });

  it("normalizes projects without updatedAt", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
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
                    shortDescription: "Desc",
                    closed: true,
                    url: "https://example.test/p/1",
                  },
                ],
              },
            },
          },
        }),
    });

    const result = await projectService.list({ owner: "acme", limit: 10 });
    expect(result.projects[0].closed).toBe(true);
    expect(result.projects[0].updatedAt).toBeUndefined();
  });

  it("normalizes items with missing content fields", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                id: "P1",
                number: 1,
                title: "Test",
                shortDescription: "",
                closed: false,
                url: "https://example.test/p/1",
                items: {
                  nodes: [
                    {
                      id: "I1",
                      type: null,
                      content: {},
                      fieldValueByName: null,
                    },
                  ],
                },
                fields: { nodes: [] },
              },
            },
          },
        }),
    });

    const result = await projectService.itemList("1", {
      owner: "acme",
      limit: 10,
    });
    expect(result.items[0].type).toBe("UNKNOWN");
    expect(result.items[0].title).toBe("Untitled");
    expect(result.items[0].status).toBe("No Status");
  });

  it("uses repo to derive owner when no explicit owner", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "org" },
          },
        }),
    });
    (api.board as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            organization: {
              projectV2: {
                title: "Board",
                items: { nodes: [] },
              },
            },
          },
        }),
    });

    await projectService.board("1", { repo: "org/repo" });
    expect(api.board).toHaveBeenCalledWith("org", 1);
  });

  it("throws for invalid project id on view", async () => {
    await expect(projectService.view("0", { owner: "acme" })).rejects.toThrow(
      "Invalid project id",
    );
  });

  it("throws when project not found on view", async () => {
    (api.owner as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            viewer: { login: "alice" },
            organization: { id: "O1", login: "acme" },
          },
        }),
    });
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { organization: null, user: null },
        }),
    });

    await expect(projectService.view("1", { owner: "acme" })).rejects.toThrow(
      "was not found",
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
