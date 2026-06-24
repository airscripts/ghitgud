import client from "@/api/client";
import labels from "@/api/labels";
import { describe, it, expect, vi, Mock } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("labels api", () => {
  it("should call client.get for fetch", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await labels.fetch("owner/repo");
    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/labels");
  });

  it("should accept an explicit repo for fetch", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await labels.fetch("owner/other");
    expect(client.get).toHaveBeenCalledWith("/repos/owner/other/labels");
  });

  it("should call client.get for get with name", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await labels.get("bug", "owner/repo");
    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/labels/bug");
  });

  it("should encode label names in path segments", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await labels.get("needs review/a+b", "owner/repo");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/labels/needs%20review%2Fa%2Bb",
    );
  });

  it("should call client.post for create", async () => {
    (client.post as Mock).mockResolvedValue({ status: 201 });
    const label = {
      name: "bug",
      color: "d73a4a",
      description: "Something isn't working",
    };

    await labels.create(label, "owner/repo");
    expect(client.post).toHaveBeenCalledWith("/repos/owner/repo/labels", {
      name: "bug",
      color: "d73a4a",
      description: "Something isn't working",
    });
  });

  it("should call client.patch for patch", async () => {
    (client.patch as Mock).mockResolvedValue({ status: 200 });
    const label = {
      name: "bug",
      color: "d73a4a",
      description: "Bug fix",
      newName: "defect",
    };

    await labels.patch(label, "owner/repo");
    expect(client.patch).toHaveBeenCalledWith("/repos/owner/repo/labels/bug", {
      color: "d73a4a",
      new_name: "defect",
      description: "Bug fix",
    });
  });

  it("should encode label names when patching", async () => {
    (client.patch as Mock).mockResolvedValue({ status: 200 });
    const label = {
      color: "d73a4a",
      name: "needs review/a+b",
      description: "Needs review",
    };

    await labels.patch(label, "owner/repo");
    expect(client.patch).toHaveBeenCalledWith(
      "/repos/owner/repo/labels/needs%20review%2Fa%2Bb",
      {
        color: "d73a4a",
        description: "Needs review",
        new_name: "needs review/a+b",
      },
    );
  });

  it("should call client.delete for delete", async () => {
    (client.delete as Mock).mockResolvedValue({ status: 204 });
    await labels.delete("bug", "owner/repo");
    expect(client.delete).toHaveBeenCalledWith("/repos/owner/repo/labels/bug");
  });

  it("should encode label names when deleting", async () => {
    (client.delete as Mock).mockResolvedValue({ status: 204 });
    await labels.delete("needs review/a+b", "owner/repo");

    expect(client.delete).toHaveBeenCalledWith(
      "/repos/owner/repo/labels/needs%20review%2Fa%2Bb",
    );
  });
});
