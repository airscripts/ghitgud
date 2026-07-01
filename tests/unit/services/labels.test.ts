import io from "@/core/io";
import api from "@/api/labels";
import logger from "@/core/logger";
import labelsService from "@/services/labels";
import { GitfleetError, NotFoundError } from "@/core/errors";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/labels", () => ({
  default: {
    get: vi.fn(),
    fetch: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    info: vi.fn(),
    start: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/io", () => ({
  default: {
    ensureDir: vi.fn(),
    fileExists: vi.fn(),
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn(),
  },
}));

const API_LABELS = [
  {
    id: 1,
    name: "feature",
    color: "ffffff",
    description: "This is a feature.",
  },
];

const METADATA_LABELS = [
  { name: "bug", color: "d73a4a", description: "Something isn't working" },
];

describe("labels", () => {
  beforeEach(() => {
    vi.spyOn(logger, "start").mockImplementation(() => {});
    vi.spyOn(logger, "success").mockImplementation(() => {});
    vi.spyOn(logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await labelsService.list("owner/repo");

    expect(result).toEqual({
      success: true,
      metadata: [
        { name: "feature", color: "ffffff", description: "This is a feature." },
      ],
    });
  });

  it("should pull labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await labelsService.pull("owner/repo");

    expect(result).toEqual({
      success: true,
      metadata: [
        { name: "feature", color: "ffffff", description: "This is a feature." },
      ],
    });

    expect(logger.success).toHaveBeenCalledWith(
      "Saved 1 label(s) to local metadata.",
    );
  });

  it("should push labels", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);
    (api.get as Mock).mockResolvedValue({ status: 200 });
    (api.patch as Mock).mockResolvedValue({ status: 200 });
    const result = await labelsService.push("owner/repo");

    expect(result).toEqual({
      success: true,
      metadata: {
        created: [],
        unchanged: [],
        updated: ["bug"],
      },
    });

    expect(logger.success).toHaveBeenCalledWith(
      "Repository labels are up to date.",
    );
  });

  it("should push labels creating new ones when not found", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);

    (api.get as Mock).mockRejectedValue(
      new NotFoundError("Resource not found."),
    );

    (api.create as Mock).mockResolvedValue({ status: 201 });
    const result = await labelsService.push("owner/repo");

    expect(result).toEqual({
      success: true,
      metadata: {
        updated: [],
        unchanged: [],
        created: ["bug"],
      },
    });

    expect(api.create).toHaveBeenCalled();
  });

  it("should prune labels", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);
    (api.delete as Mock).mockResolvedValue({ status: 204 });

    const result = await labelsService.prune("owner/repo", { yes: true });
    expect(result).toEqual({ success: true, metadata: { deleted: 1 } });
    expect(logger.success).toHaveBeenCalledWith("Deleted 1 label(s).");
  });

  it("should throw when no metadata file for push", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    await expect(labelsService.push("owner/repo")).rejects.toThrow(
      "No metadata file found.",
    );

    await expect(labelsService.push("owner/repo")).rejects.toThrow(
      GitfleetError,
    );
  });

  it("should throw when no metadata file for prune", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    await expect(labelsService.prune("owner/repo")).rejects.toThrow(
      "No metadata file found.",
    );
  });

  it("should pull from template", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);
    vi.spyOn(io, "ensureDir").mockImplementation(() => {});
    vi.spyOn(io, "writeJsonFile").mockImplementation(() => {});

    const result = await labelsService.pullTemplate("base", "/mock/templates");
    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.length).toBeGreaterThan(0);
  });

  it("should throw for nonexistent template", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);

    await expect(
      labelsService.pullTemplate("nonexistent", "/mock/templates"),
    ).rejects.toThrow(
      /Template "nonexistent" not found at .*mock.*templates.*nonexistent\.json\./,
    );

    await expect(
      labelsService.pullTemplate("nonexistent", "/mock/templates"),
    ).rejects.toThrow(GitfleetError);
  });

  it("should push from template", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);

    (api.get as Mock).mockRejectedValue(
      new NotFoundError("Resource not found."),
    );

    (api.create as Mock).mockResolvedValue({ status: 201 });
    const result = await labelsService.pushTemplate(
      "base",
      "/mock/templates",
      "owner/repo",
    );

    expect(result).toEqual({
      success: true,
      metadata: {
        updated: [],
        unchanged: [],
        created: ["bug"],
      },
    });
  });

  it("should throw for nonexistent template on push", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    (api.get as Mock).mockResolvedValue({ status: 200 });

    await expect(
      labelsService.pushTemplate(
        "nonexistent",
        "/mock/templates",
        "owner/repo",
      ),
    ).rejects.toThrow(
      /Template "nonexistent" not found at .*mock.*templates.*nonexistent\.json\./,
    );
  });

  it("should create a label", async () => {
    const createdLabel = {
      id: 99,
      color: "a2eeef",
      name: "enhancement",
      description: "New feature or request",
    };

    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve(createdLabel),
    });

    const result = await labelsService.create(
      "enhancement",
      {
        color: "a2eeef",
        description: "New feature or request",
      },
      "owner/repo",
    );

    expect(result.success).toBe(true);
    expect(result.label.name).toBe("enhancement");
    expect(result.label.color).toBe("a2eeef");
    expect(api.create).toHaveBeenCalledWith(
      {
        color: "a2eeef",
        name: "enhancement",
        description: "New feature or request",
      },
      "owner/repo",
    );
  });

  it("should create a label with defaults", async () => {
    const createdLabel = {
      id: 100,
      color: "ededed",
      description: "",
      name: "question",
    };

    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve(createdLabel),
    });

    const result = await labelsService.create("question", {}, "owner/repo");

    expect(result.success).toBe(true);
    expect(api.create).toHaveBeenCalledWith(
      { name: "question", color: "ededed", description: "" },
      "owner/repo",
    );
  });

  it("should get a label", async () => {
    const labelData = {
      id: 1,
      name: "bug",
      color: "d73a4a",
      description: "Something isn't working",
    };

    (api.get as Mock).mockResolvedValue({
      json: () => Promise.resolve(labelData),
    });

    const result = await labelsService.get("bug", "owner/repo");
    expect(result.success).toBe(true);
    expect(result.label.name).toBe("bug");
    expect(result.label.color).toBe("d73a4a");
    expect(api.get).toHaveBeenCalledWith("bug", "owner/repo");
  });

  it("should update a label", async () => {
    const updatedLabel = {
      id: 1,
      color: "00ff00",
      name: "Bug Report",
      description: "Updated description",
    };

    (api.patch as Mock).mockResolvedValue({
      json: () => Promise.resolve(updatedLabel),
    });

    const result = await labelsService.update(
      "bug",
      {
        color: "00ff00",
        newName: "Bug Report",
        description: "Updated description",
      },
      "owner/repo",
    );

    expect(result.success).toBe(true);
    expect(result.label.name).toBe("Bug Report");
    expect(api.patch).toHaveBeenCalled();
  });

  it("should throw when updating a label with no options", async () => {
    await expect(labelsService.update("bug", {}, "owner/repo")).rejects.toThrow(
      "At least one of --new-name, --color, or --description is required.",
    );
  });

  it("should delete a label", async () => {
    (api.delete as Mock).mockResolvedValue({ status: 204 });

    const result = await labelsService.deleteLabel("bug", "owner/repo", {
      yes: true,
    });

    expect(result.success).toBe(true);
    expect(result.deleted).toBe("bug");
    expect(api.delete).toHaveBeenCalledWith("bug", "owner/repo");
  });

  it("should throw when deleting a label without --yes", async () => {
    await expect(
      labelsService.deleteLabel("bug", "owner/repo"),
    ).rejects.toThrow("This operation deletes a label.");
  });

  it("should clone labels from one repo to another", async () => {
    const sourceLabels = [
      { id: 1, name: "bug", color: "d73a4a", description: "Bug report" },
      { id: 2, name: "feature", color: "a2eeef", description: "New feature" },
    ];

    (api.fetch as Mock).mockResolvedValue({
      json: () => Promise.resolve(sourceLabels),
    });

    (api.get as Mock).mockRejectedValue(
      new NotFoundError("Resource not found."),
    );

    (api.create as Mock).mockResolvedValue({ status: 201 });
    const result = await labelsService.clone("owner/source", "owner/target");

    expect(result.success).toBe(true);
    expect(api.fetch).toHaveBeenCalledWith("owner/source");
    expect(api.create).toHaveBeenCalledTimes(2);
  });
});
