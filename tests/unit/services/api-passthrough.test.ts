import { execFileSync } from "child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";

import client from "@/api/client";
import output from "@/core/output";
import service from "@/services/api";
import { jsonResponse } from "../helpers/response";

vi.mock("@/api/client", () => ({
  default: {
    requestTokenRequired: vi.fn(),
    requestUrlTokenRequired: vi.fn(),
  },
}));
vi.mock("@/core/output", () => ({ default: { writeValue: vi.fn() } }));
vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

describe("api passthrough service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("defaults fields to a POST body", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ ok: true }),
    );
    const result = await service.request("repos/owner/repo", {
      fields: ["name=value"],
    });
    expect(client.requestTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo",
      { method: "POST", body: { name: "value" } },
    );
    expect(result.data).toEqual({ ok: true });
  });

  it("flattens pages and applies jq", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse([{ name: "a" }], {
        headers: {
          "content-type": "application/json",
          link: '<https://api.github.com/items?page=2>; rel="next"',
        },
      }),
    );
    vi.mocked(client.requestUrlTokenRequired).mockResolvedValue(
      jsonResponse([{ name: "b" }]),
    );
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify(["a", "b"]));
    const result = await service.request("items", {
      paginate: true,
      jq: "map(.name)",
    });
    expect(result.data).toEqual(["a", "b"]);
    expect(output.writeValue).toHaveBeenCalledWith(["a", "b"]);
  });

  it("rejects unsafe endpoints and invalid option combinations", async () => {
    await expect(service.request("https://example.com", {})).rejects.toThrow(
      "relative GitHub API path",
    );
    await expect(
      service.request("items", { method: "POST", paginate: true }),
    ).rejects.toThrow("only supported for GET");
    await expect(
      service.request("items", { silent: true, jq: "." }),
    ).rejects.toThrow("cannot be combined");
  });

  it("rejects duplicate fields and non-array pagination", async () => {
    await expect(
      service.request("items", { fields: ["a=1", "a=2"] }),
    ).rejects.toThrow("Duplicate");
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ items: [] }),
    );
    await expect(service.request("items", { paginate: true })).rejects.toThrow(
      "top-level arrays",
    );
  });

  it("supports silent text responses", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      new Response("plain text", { status: 200 }),
    );
    const result = await service.request("text", { silent: true });
    expect(result.data).toBe("plain text");
    expect(output.writeValue).not.toHaveBeenCalled();
  });

  it("normalizes paths and empty responses", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    expect((await service.request("/user", {})).data).toBeNull();
    expect(client.requestTokenRequired).toHaveBeenCalledWith("/user", {
      method: "GET",
    });
    await expect(service.request("//example.com/user", {})).rejects.toThrow(
      "relative GitHub API path",
    );
  });

  it("accepts an explicit mutation method without fields", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ updated: true }),
    );
    await service.request("user", { method: "patch" });
    expect(client.requestTokenRequired).toHaveBeenCalledWith("/user", {
      method: "PATCH",
    });
  });

  it("rejects malformed fields and unsupported methods", async () => {
    await expect(
      service.request("items", { fields: ["missing-separator"] }),
    ).rejects.toThrow("Invalid API field");
    await expect(
      service.request("items", { fields: ["=value"] }),
    ).rejects.toThrow("Invalid API field");
    await expect(service.request("items", { method: "TRACE" })).rejects.toThrow(
      "Unsupported API method",
    );
  });

  it("rejects unsafe and non-array subsequent pages", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValueOnce(
      jsonResponse([], {
        headers: {
          link: '<https://example.com/items?page=2>; rel="next">',
        },
      }),
    );
    await expect(service.request("items", { paginate: true })).rejects.toThrow(
      "unexpected URL",
    );

    vi.mocked(client.requestTokenRequired).mockResolvedValueOnce(
      jsonResponse([], {
        headers: {
          link: '<https://api.github.com/items?page=2>; rel="next">',
        },
      }),
    );
    vi.mocked(client.requestUrlTokenRequired).mockResolvedValueOnce(
      jsonResponse({ item: true }),
    );
    await expect(service.request("items", { paginate: true })).rejects.toThrow(
      "top-level arrays",
    );
  });

  it("reports jq filter errors", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ ok: true }),
    );
    vi.mocked(execFileSync).mockImplementation(() => {
      const err = new Error("jq: error") as Error & { stderr: string };
      err.stderr = "jq: error";
      throw err;
    });
    await expect(
      service.request("items", { jq: "not valid [" }),
    ).rejects.toThrow("jq filter failed");
  });

  it("preserves multiple jq results", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ first: 1, second: 2 }),
    );
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify([1, 2]));
    const result = await service.request("items", {
      jq: ".first, .second",
    });
    expect(result.data).toEqual([1, 2]);
  });

  it("reports jq not installed", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ ok: true }),
    );
    vi.mocked(execFileSync).mockImplementation(() => {
      const err = new Error("spawn jq ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      throw err;
    });
    await expect(service.request("items", { jq: "." })).rejects.toThrow(
      "jq is not installed",
    );
  });

  it("unwraps single jq results", async () => {
    vi.mocked(client.requestTokenRequired).mockResolvedValue(
      jsonResponse({ name: "test" }),
    );
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify(["test"]));
    const result = await service.request("items", {
      jq: ".name",
    });
    expect(result.data).toBe("test");
  });
});
