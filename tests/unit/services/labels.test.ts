import io from "@/core/io";
import api from "@/api/labels";
import format from "@/core/format";
import labelsService from "@/services/labels";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getRepo: vi.fn(() => "owner/repo"),
    isNotFound: vi.fn((status: number) => status === 404),
    isOk: vi.fn((status: number) => status >= 200 && status < 300),
  },
}));

vi.mock("@/api/labels", () => ({
  default: {
    get: vi.fn(),
    fetch: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
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
    vi.spyOn(format, "formatOutput").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return pong for ping", () => {
    const result = labelsService.ping();
    expect(result).toEqual({ success: true, message: "pong" });
    expect(format.formatOutput).toHaveBeenCalledWith({ success: true, message: "pong" });
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
    expect(result).toEqual({ success: true });
  });

  it("should push labels", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);
    const mockResponse = { status: 200 };

    (api.get as Mock).mockResolvedValue(mockResponse);
    (api.patch as Mock).mockResolvedValue({ status: 200 });
    const result = await labelsService.push();
    expect(result).toEqual({ success: true });
  });

  it("should push labels creating new ones when not found", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);
    (api.get as Mock).mockResolvedValue({ status: 404 });
    (api.create as Mock).mockResolvedValue({ status: 201 });

    const result = await labelsService.push();
    expect(result).toEqual({ success: true });
    expect(api.create).toHaveBeenCalled();
  });

  it("should prune labels", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(true);
    vi.spyOn(io, "readJsonFile").mockReturnValue(METADATA_LABELS);
    (api.delete as Mock).mockResolvedValue({ status: 204 });

    const result = await labelsService.prune();
    expect(result).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalled();
  });

  it("should throw when no metadata file for push", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    await expect(labelsService.push()).rejects.toThrow("No metadata file found.");
  });

  it("should throw when no metadata file for prune", async () => {
    vi.spyOn(io, "fileExists").mockReturnValue(false);
    await expect(labelsService.prune()).rejects.toThrow("No metadata file found.");
  });

  it("should pull from template", async () => {
    const result = await labelsService.pullTemplate("base", process.cwd() + "/templates");
    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.length).toBeGreaterThan(0);
  });

  it("should throw for nonexistent template", async () => {
    await expect(labelsService.pullTemplate("nonexistent", process.cwd() + "/templates")).rejects.toThrow(
      'Template "nonexistent" not found'
    );
  });

  it("should push from template", async () => {
    (api.get as Mock).mockResolvedValue({ status: 404 });
    (api.create as Mock).mockResolvedValue({ status: 201 });
    const result = await labelsService.pushTemplate("base", process.cwd() + "/templates");
    expect(result).toEqual({ success: true });
  });

  it("should throw for nonexistent template on push", async () => {
    (api.get as Mock).mockResolvedValue({ status: 200 });

    await expect(labelsService.pushTemplate("nonexistent", process.cwd() + "/templates")).rejects.toThrow(
      'Template "nonexistent" not found'
    );
  });
});