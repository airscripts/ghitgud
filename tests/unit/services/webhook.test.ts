import api from "@/api/webhooks";
import webhookService from "@/services/webhook";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/webhooks", () => ({
  default: {
    list: vi.fn(),
    listOrg: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    createOrg: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    test: vi.fn(),
    deliveries: vi.fn(),
    delivery: vi.fn(),
    redeliver: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

const webhook = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "web",
  active: true,
  events: ["push"],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  config: { url: "https://example.com", content_type: "json" },
  ...overrides,
});

describe("webhook service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists webhooks", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([webhook()]),
    });
    const result = await webhookService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(api.list).toHaveBeenCalledWith("owner/repo");
  });

  it("lists org webhooks", async () => {
    (api.listOrg as Mock).mockResolvedValue({
      json: () => Promise.resolve([webhook()]),
    });
    const result = await webhookService.listOrg("myorg");
    expect(result.success).toBe(true);
    expect(api.listOrg).toHaveBeenCalledWith("myorg");
  });

  it("creates a webhook", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve(webhook({ id: 42 })),
    });
    const result = await webhookService.create({
      repo: "owner/repo",
      url: "https://example.com",
      events: ["push"],
      contentType: "json",
      active: true,
    });
    expect(result.success).toBe(true);
    expect(api.create).toHaveBeenCalled();
  });

  it("creates a webhook with secret", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve(webhook({ id: 43 })),
    });
    const result = await webhookService.create({
      repo: "owner/repo",
      url: "https://example.com",
      events: ["push"],
      secret: "mysecret",
      contentType: "json",
    });
    expect(result.success).toBe(true);
  });

  it("creates a webhook for org", async () => {
    (api.createOrg as Mock).mockResolvedValue({
      json: () => Promise.resolve(webhook({ id: 44 })),
    });
    const result = await webhookService.create({
      org: "myorg",
      url: "https://example.com",
      events: ["push"],
    });
    expect(result.success).toBe(true);
    expect(api.createOrg).toHaveBeenCalled();
  });

  it("creates a webhook with nullish defaults", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 45,
          name: undefined,
          url: undefined,
          active: undefined,
          events: undefined,
          created_at: undefined,
          updated_at: undefined,
          config: undefined,
        }),
    });
    const result = await webhookService.create({
      repo: "owner/repo",
      url: "https://example.com",
      events: ["push"],
    });
    expect(result.success).toBe(true);
    expect(result.webhook.name).toBe("web");
    expect(result.webhook.active).toBe(true);
  });

  it("edits a webhook", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve(webhook()),
    });
    const result = await webhookService.edit({
      repo: "owner/repo",
      id: 1,
      url: "https://new.example.com",
    });
    expect(result.success).toBe(true);
    expect(api.update).toHaveBeenCalled();
  });

  it("deletes a webhook", async () => {
    (api.remove as Mock).mockResolvedValue({ status: 204 });
    const result = await webhookService.remove({
      repo: "owner/repo",
      id: 1,
    });
    expect(result.success).toBe(true);
    expect(api.remove).toHaveBeenCalledWith("owner/repo", 1);
  });

  it("triggers a test ping", async () => {
    (api.test as Mock).mockResolvedValue({ status: 204 });
    const result = await webhookService.test({
      repo: "owner/repo",
      id: 1,
    });
    expect(result.success).toBe(true);
    expect(api.test).toHaveBeenCalledWith("owner/repo", 1);
  });

  it("lists deliveries", async () => {
    (api.deliveries as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 1,
            event: "push",
            action: null,
            status: "completed",
            status_code: 200,
            duration: 0.5,
            delivered_at: "2026-01-01T00:00:00Z",
            guid: "abc",
          },
        ]),
    });
    const result = await webhookService.deliveries({
      repo: "owner/repo",
      id: 1,
    });
    expect(result.success).toBe(true);
    expect(api.deliveries).toHaveBeenCalledWith("owner/repo", 1);
  });

  it("views a delivery", async () => {
    (api.delivery as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 1,
          event: "push",
          action: null,
          status: "completed",
          status_code: 200,
          request: { headers: {}, payload: {} },
          response: { headers: {}, body: "ok" },
        }),
    });
    const result = await webhookService.delivery({
      repo: "owner/repo",
      id: 1,
      deliveryId: 1,
    });
    expect(result.success).toBe(true);
    expect(api.delivery).toHaveBeenCalledWith("owner/repo", 1, 1);
  });

  it("redelivers a delivery", async () => {
    (api.redeliver as Mock).mockResolvedValue({ status: 202 });
    const result = await webhookService.redeliver({
      repo: "owner/repo",
      id: 1,
      deliveryId: 1,
    });
    expect(result.success).toBe(true);
    expect(api.redeliver).toHaveBeenCalledWith("owner/repo", 1, 1);
  });
});
