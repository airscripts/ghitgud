import client from "@/providers/github/client";
import projects from "@/api/projects";
import { describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    graphqlTokenRequired: vi.fn(),
  },
}));

describe("projects api", () => {
  it("queries project boards through GraphQL", async () => {
    (client.graphqlTokenRequired as Mock).mockResolvedValue({ status: 200 });
    await projects.board("airscripts", 1);

    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("query Project"),
      {
        owner: "airscripts",
        number: 1,
        limit: 100,
      },
    );
  });
});
