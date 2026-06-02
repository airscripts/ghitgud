import client from "@/api/client";
import projects from "@/api/projects";
import { describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    graphqlTokenRequired: vi.fn(),
  },
}));

describe("projects api", () => {
  it("queries project boards through GraphQL", async () => {
    (client.graphqlTokenRequired as Mock).mockResolvedValue({ status: 200 });
    await projects.board("airscripts", 1);

    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("ProjectBoard"),
      {
        owner: "airscripts",
        number: 1,
      },
    );
  });
});
