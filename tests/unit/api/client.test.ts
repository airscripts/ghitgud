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
  },
}));

const ORIGINAL_FETCH = global.fetch;

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
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 200,
      });
      const result = await client.get("/repos/owner/repo/labels");
      expect(result.status).toBe(200);
    });

    it("should accept 201 Created response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 201,
      });
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
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 204,
      });
      const result = await client.delete("/repos/owner/repo/labels/bug");
      expect(result.status).toBe(204);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/labels/bug",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("should make a PATCH request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 200,
      });
      await client.patch("/repos/owner/repo/labels/bug", { color: "fff" });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/labels/bug",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    it("should throw AuthError on 401", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 401,
      });
      await expect(client.get("/test")).rejects.toThrow("Unauthorized.");
    });

    it("should throw NotFoundError on 404", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 404,
      });
      await expect(client.get("/test")).rejects.toThrow("Resource not found.");
    });

    it("should throw UnprocessableError on 422", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 422,
      });
      await expect(client.get("/test")).rejects.toThrow(
        "Content is unprocessable.",
      );
    });

    it("should throw GhitgudError on unexpected status", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 500,
      });
      await expect(client.get("/test")).rejects.toThrow(
        "Unexpected status code.: 500",
      );
      await expect(client.get("/test")).rejects.toThrow(GhitgudError);
    });

    it("should include auth and api headers", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 200,
      });
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
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 201,
      });
      await client.post("/test", { name: "bug" });
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1].body).toBe(JSON.stringify({ name: "bug" }));
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
