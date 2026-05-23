import io from "@/core/io";
import api from "@/api/labels";
import logger from "@/core/logger";
import labelsService from "@/services/labels";
import { NotFoundError } from "@/core/errors";
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

  it("should return pong for ping", () => {
    const result = labelsService.ping();
    expect(result).toEqual({ success: true, message: "pong" });
    expect(logger.success).toHaveBeenCalledWith("pong.");
  });

  it("should list labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await labelsService.list();

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
    const result = await labelsService.pull();

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
    const result = await labelsService.push();

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
    const result = await labelsService.push();

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

    const result = await labelsService.prune();
    expect(result).toEqual({ success: true, metadata: { deleted: 1 } });
    expect(logger.success).toHaveBeenCalledWith("Deleted 1 label(s).");
  });

  it("should throw when no metadata file for push", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    await expect(labelsService.push()).rejects.toThrow(
      "No metadata file found.",
    );
  });

  it("should throw when no metadata file for prune", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    await expect(labelsService.prune()).rejects.toThrow(
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
      'Template "nonexistent" not found at /mock/templates/nonexistent.json.',
    );
  });

  it("should push from template", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);

    (api.get as Mock).mockRejectedValue(
      new NotFoundError("Resource not found."),
    );

    (api.create as Mock).mockResolvedValue({ status: 201 });
    const result = await labelsService.pushTemplate("base", "/mock/templates");

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
      labelsService.pushTemplate("nonexistent", "/mock/templates"),
    ).rejects.toThrow(
      'Template "nonexistent" not found at /mock/templates/nonexistent.json.',
    );
  });
});
