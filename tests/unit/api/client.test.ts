import client from "@/api/client";
import { GhitgudError } from "@/core/errors";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/config", () => ({
  default: {
    has: vi.fn(),
    read: vi.fn(),
    write: vi.fn(),
    getRepo: vi.fn(() => "owner/repo"),
    getToken: vi.fn(() => "test-token"),
    getTokenOptional: vi.fn(() => "test-token"),
  },
}));

const ORIGINAL_FETCH = global.fetch;
const mockFetch = () => global.fetch as ReturnType<typeof vi.fn>;

describe("client", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  describe("request", () => {
    it("should make a successful GET request", async () => {
      mockFetch().mockResolvedValue({ status: 200 });

      const result = await client.get("/repos/owner/repo/labels");
      expect(result.status).toBe(200);
    });

    it("should accept 201 Created response", async () => {
      mockFetch().mockResolvedValue({ status: 201 });

      const result = await client.post("/repos/owner/repo/labels", {
        name: "bug",
      });

      expect(result.status).toBe(201);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/labels",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should accept 204 No Content response", async () => {
      mockFetch().mockResolvedValue({ status: 204 });

      const result = await client.delete("/repos/owner/repo/labels/bug");
      expect(result.status).toBe(204);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/labels/bug",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("should make a PATCH request", async () => {
      mockFetch().mockResolvedValue({ status: 200 });

      await client.patch("/repos/owner/repo/labels/bug", { color: "fff" });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/labels/bug",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    it("should make a PUT request", async () => {
      mockFetch().mockResolvedValue({ status: 200 });

      await client.put("/notifications/threads/123/subscription", {
        ignored: true,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/notifications/threads/123/subscription",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should throw AuthError on 401", async () => {
      mockFetch().mockResolvedValue({ status: 401, headers: { get: vi.fn() } });

      await expect(client.get("/test")).rejects.toThrow("Unauthorized.");
    });

    it("should throw NotFoundError on 404", async () => {
      mockFetch().mockResolvedValue({ status: 404, headers: { get: vi.fn() } });

      await expect(client.get("/test")).rejects.toThrow("Resource not found.");
    });

    it("should throw UnprocessableError on 422", async () => {
      mockFetch().mockResolvedValue({ status: 422, headers: { get: vi.fn() } });

      await expect(client.get("/test")).rejects.toThrow(
        "Content is unprocessable.",
      );
    });

    it("should throw GhitgudError on unexpected status", async () => {
      mockFetch().mockResolvedValue({ status: 500, headers: { get: vi.fn() } });

      await expect(client.get("/test")).rejects.toThrow(
        "Unexpected status code.: 500",
      );

      await expect(client.get("/test")).rejects.toThrow(GhitgudError);
    });

    it("should include auth and api headers", async () => {
      mockFetch().mockResolvedValue({ status: 200 });

      await client.get("/test");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          }),
        }),
      );
    });

    it("should send JSON body when provided", async () => {
      mockFetch().mockResolvedValue({ status: 201 });

      await client.post("/test", { name: "bug" });
      const call = mockFetch().mock.calls[0];
      expect(call[1].body).toBe(JSON.stringify({ name: "bug" }));
    });

    it("should follow pagination links", async () => {
      mockFetch()
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve([{ id: 1 }]),
          headers: {
            get: vi.fn(
              () => '<https://api.github.com/test?page=2>; rel="next"',
            ),
          },
        })
        .mockResolvedValueOnce({
          status: 200,
          json: () => Promise.resolve([{ id: 2 }]),
          headers: { get: vi.fn(() => null) },
        });

      const result = await client.getPaginated<{ id: number }>("/test?page=1");
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe("isOk", () => {
    it("should return true for 2xx status codes", () => {
      expect(client.isOk(200)).toBe(true);
      expect(client.isOk(201)).toBe(true);
      expect(client.isOk(204)).toBe(true);
      expect(client.isOk(404)).toBe(false);
      expect(client.isOk(500)).toBe(false);
    });
  });

  describe("isNotFound", () => {
    it("should return true only for 404", () => {
      expect(client.isNotFound(404)).toBe(true);
      expect(client.isNotFound(200)).toBe(false);
    });
  });

  describe("getRepo", () => {
    it("should return the configured repo", () => {
      expect(client.getRepo()).toBe("owner/repo");
    });
  });
});
