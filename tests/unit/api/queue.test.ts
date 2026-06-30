import { describe, expect, it, vi } from "vitest";

import client from "@/api/client";
import queue from "@/api/queue";

vi.mock("@/api/client", () => ({
  default: { graphqlTokenRequired: vi.fn() },
}));

describe("queue api", () => {
  it("queries queues and executes mutations", async () => {
    await queue.get("owner/repo", "main", 20);
    await queue.pullRequest("owner/repo", 7);
    await queue.history("owner/repo", "main", 10);
    await queue.enqueue("PR1", "abc");
    await queue.dequeue("PR1");
    expect(client.graphqlTokenRequired).toHaveBeenCalledTimes(5);
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("enqueuePullRequest"),
      { input: { pullRequestId: "PR1", expectedHeadOid: "abc" } },
    );
  });
});
