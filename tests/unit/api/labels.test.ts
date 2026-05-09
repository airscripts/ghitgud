import { describe, it, expect, vi, Mock } from "vitest";

import client from "@/api/client";
import labels from "@/api/labels";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getRepo: vi.fn(() => "owner/repo"),
  },
}));

describe("labels api", () => {
  it("should call client.get for fetch", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await labels.fetch();
    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/labels");
  });

  it("should call client.get for get with name", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await labels.get("bug");
    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/labels/bug");
  });

  it("should call client.post for create", async () => {
    (client.post as Mock).mockResolvedValue({ status: 201 });
    const label = {
      name: "bug",
      color: "d73a4a",
      description: "Something isn't working",
    };
    await labels.create(label);

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
    await labels.patch(label);

    expect(client.patch).toHaveBeenCalledWith("/repos/owner/repo/labels/bug", {
      color: "d73a4a",
      new_name: "defect",
      description: "Bug fix",
    });
  });

  it("should call client.delete for delete", async () => {
    (client.delete as Mock).mockResolvedValue({ status: 204 });
    await labels.delete("bug");
    expect(client.delete).toHaveBeenCalledWith("/repos/owner/repo/labels/bug");
  });
});
