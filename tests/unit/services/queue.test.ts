import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api/queue";
import reposApi from "@/api/repos";
import rulesetsApi from "@/api/rulesets";
import service from "@/services/queue";
import { jsonResponse } from "../helpers/response";

vi.mock("@/api/queue", () => ({
  default: {
    get: vi.fn(),
    pullRequest: vi.fn(),
    enqueue: vi.fn(),
    dequeue: vi.fn(),
    history: vi.fn(),
  },
}));
vi.mock("@/api/repos", () => ({ default: { get: vi.fn() } }));
vi.mock("@/api/rulesets", () => ({ default: { checkBranch: vi.fn() } }));
vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderSummary: vi.fn() },
}));
vi.mock("@/core/logger", () => ({ default: { success: vi.fn() } }));

const queue = {
  id: "Q1",
  nextEntryEstimatedTimeToMerge: 60,
  configuration: { mergeMethod: "SQUASH" },
  entries: {
    totalCount: 1,
    nodes: [
      {
        id: "E1",
        position: 1,
        state: "QUEUED",
        enqueuedAt: "2026-06-30T00:00:00Z",
        estimatedTimeToMerge: 60,
        enqueuer: { login: "alice" },
        pullRequest: {
          id: "PR1",
          number: 1,
          title: "Change",
          url: "https://example.test/pr/1",
          headRefName: "feature",
          baseRefName: "main",
        },
      },
    ],
  },
};

describe("queue service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reposApi.get).mockResolvedValue({
      default_branch: "main",
    } as never);
  });

  it("lists entries and reports queue status", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(
        jsonResponse({ data: { repository: { mergeQueue: queue } } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { repository: { mergeQueue: queue } } }),
      );
    vi.mocked(rulesetsApi.checkBranch).mockResolvedValue(
      jsonResponse([
        {
          type: "required_status_checks",
          parameters: { required_status_checks: [{ context: "build" }] },
        },
      ]),
    );
    expect((await service.list("owner/repo")).entries).toHaveLength(1);
    expect((await service.status("owner/repo")).requiredChecks).toEqual([
      "build",
    ]);
  });

  it("adds and removes pull requests", async () => {
    vi.mocked(api.pullRequest)
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            repository: {
              pullRequest: {
                id: "PR1",
                headRefOid: "abc",
                mergeQueueEntry: null,
              },
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            repository: {
              pullRequest: { id: "PR1", mergeQueueEntry: { id: "E1" } },
            },
          },
        }),
      );
    vi.mocked(api.enqueue).mockResolvedValue(
      jsonResponse({
        data: { enqueuePullRequest: { mergeQueueEntry: { id: "E1" } } },
      }),
    );
    vi.mocked(api.dequeue).mockResolvedValue(
      jsonResponse({
        data: { dequeuePullRequest: { mergeQueueEntry: { id: "E1" } } },
      }),
    );
    await service.add("owner/repo", 1);
    await service.remove("owner/repo", 1);
    expect(api.enqueue).toHaveBeenCalledWith("PR1", "abc");
    expect(api.dequeue).toHaveBeenCalledWith("PR1");
  });

  it("returns an unconfigured status", async () => {
    vi.mocked(api.get).mockResolvedValue(
      jsonResponse({ data: { repository: { mergeQueue: null } } }),
    );
    expect((await service.status("owner/repo")).configured).toBe(false);
  });

  it("normalizes queue history", async () => {
    vi.mocked(api.history).mockResolvedValue(
      jsonResponse({
        data: {
          repository: {
            pullRequests: {
              nodes: [
                {
                  number: 1,
                  title: "Change",
                  url: "https://example.test/1",
                  timelineItems: {
                    nodes: [
                      {
                        id: "H1",
                        __typename: "AddedToMergeQueueEvent",
                        createdAt: "2026-06-30T00:00:00Z",
                        actor: { login: "alice" },
                      },
                      {
                        id: "H2",
                        __typename: "RemovedFromMergeQueueEvent",
                        createdAt: "2026-06-29T00:00:00Z",
                        actor: null,
                        reason: "checks failed",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
    );
    const result = await service.history("owner/repo", { limit: 10 });
    expect(result.events.map((event) => event.action)).toEqual([
      "added",
      "removed",
    ]);
  });

  it("rejects invalid history limits and queue membership conflicts", async () => {
    await expect(service.history("owner/repo", { limit: 101 })).rejects.toThrow(
      "between 1 and 100",
    );
    vi.mocked(api.pullRequest).mockResolvedValue(
      jsonResponse({
        data: {
          repository: {
            pullRequest: { id: "PR1", mergeQueueEntry: { id: "E1" } },
          },
        },
      }),
    );
    await expect(service.add("owner/repo", 1)).rejects.toThrow("already");
  });
});
