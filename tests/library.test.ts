import fs from "fs";
import { describe, it, expect, vi, Mock } from "vitest";

import api from "../app/api";
import library from "../app/library";

vi.mock("../app/api", () => ({
  default: {
    labels: {
      get: vi.fn(),
      fetch: vi.fn(),
      patch: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
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
  {
    name: "feature",
    color: "ffffff",
    description: "This is a feature.",
  },
];

describe("ping", () => {
  it("should return a pong", () => {
    const spy = vi.spyOn(console, "info");
    library.ping();
    expect(spy).toHaveBeenCalledWith("pong");
    expect(library.ping()).toEqual({ success: true });
  });
});

describe("labels", () => {
  it("should list labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.labels.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await library.labels.list();
    expect(result).toEqual({ success: true, metadata: METADATA_LABELS });
  });

  it("should pull labels", async () => {
    const spy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.labels.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await library.labels.pull();

    expect(spy).toHaveBeenCalledWith(
      "metadata/labels.json",
      JSON.stringify(METADATA_LABELS, null, 2)
    );

    expect(result).toEqual({ success: true });
  });

  it("should push labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.labels.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await library.labels.push();
    expect(result).toEqual({ success: true });
  });

  it("should prune labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.labels.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await library.labels.prune();
    expect(result).toEqual({ success: true });
  });
});
