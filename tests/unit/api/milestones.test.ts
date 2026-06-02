import client from "@/api/client";
import milestones from "@/api/milestones";
import { describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    getRepo: vi.fn(() => "owner/repo"),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("milestones api", () => {
  it("lists milestones by state", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await milestones.list("closed");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/milestones?state=closed&per_page=100",
    );
  });

  it("creates milestones with token required", async () => {
    (client.postTokenRequired as Mock).mockResolvedValue({ status: 201 });
    await milestones.create({
      title: "v2.9.0",
      dueOn: "2026-06-30T00:00:00.000Z",
    });

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/milestones",
      {
        title: "v2.9.0",
        due_on: "2026-06-30T00:00:00.000Z",
      },
    );
  });

  it("closes milestones with token required", async () => {
    (client.patchTokenRequired as Mock).mockResolvedValue({ status: 200 });
    await milestones.close(3);

    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/milestones/3",
      { state: "closed" },
    );
  });
});
