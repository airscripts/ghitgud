import { describe, it, expect, vi, beforeEach } from "vitest";

import webhookService from "@/services/webhook";
import webhookOperations from "@/tui/operations/webhook";

vi.mock("@/services/webhook", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    test: vi.fn(),
    deliveries: vi.fn(),
    delivery: vi.fn(),
    redeliver: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui webhook operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs webhook.list", async () => {
    await webhookOperations[0].run({ values: {} });
    expect(webhookService.list).toHaveBeenCalledWith({ repo: "owner/repo" });
  });

  it("runs webhook.create", async () => {
    await webhookOperations[1].run({
      values: {
        url: "https://example.com/hook",
        events: "push, pull_request",
        secret: "s3cret",
        contentType: "json",
      },
    });
    expect(webhookService.create).toHaveBeenCalledWith({
      repo: "owner/repo",
      url: "https://example.com/hook",
      events: ["push", "pull_request"],
      secret: "s3cret",
      contentType: "json",
      active: true,
    });
  });

  it("runs webhook.delete", async () => {
    await webhookOperations[2].run({ values: { id: 42 } });
    expect(webhookService.remove).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
    });
  });

  it("runs webhook.test", async () => {
    await webhookOperations[3].run({ values: { id: 42 } });
    expect(webhookService.test).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
    });
  });

  it("runs webhook.delivery.list", async () => {
    await webhookOperations[4].run({ values: { id: 42 } });
    expect(webhookService.deliveries).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
    });
  });

  it("runs webhook.delivery.view", async () => {
    await webhookOperations[5].run({ values: { id: 42, deliveryId: 99 } });
    expect(webhookService.delivery).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
      deliveryId: 99,
    });
  });

  it("runs webhook.delivery.redeliver", async () => {
    await webhookOperations[6].run({ values: { id: 42, deliveryId: 99 } });
    expect(webhookService.redeliver).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
      deliveryId: 99,
    });
  });
});
