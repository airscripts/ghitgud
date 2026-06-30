import webhooks from "@/api/webhooks";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("webhooks api", () => {
  it("lists repo webhooks", () => {
    webhooks.list("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks",
    );
  });

  it("lists org webhooks", () => {
    webhooks.listOrg("myorg");
    expect(client.getTokenRequired).toHaveBeenCalledWith("/orgs/myorg/hooks");
  });

  it("creates a repo webhook", () => {
    webhooks.create("owner/repo", {
      url: "https://example.com",
      events: ["push"],
    });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks",
      {
        url: "https://example.com",
        events: ["push"],
      },
    );
  });

  it("creates an org webhook", () => {
    webhooks.createOrg("myorg", {
      url: "https://example.com",
      events: ["push"],
    });
    expect(client.postTokenRequired).toHaveBeenCalledWith("/orgs/myorg/hooks", {
      url: "https://example.com",
      events: ["push"],
    });
  });

  it("updates a webhook", () => {
    webhooks.update("owner/repo", 1, { url: "https://new.example.com" });
    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks/1",
      {
        url: "https://new.example.com",
      },
    );
  });

  it("deletes a webhook", () => {
    webhooks.remove("owner/repo", 1);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks/1",
    );
  });

  it("triggers a test ping", () => {
    webhooks.test("owner/repo", 1);
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks/1/tests",
      {},
    );
  });

  it("lists deliveries", () => {
    webhooks.deliveries("owner/repo", 1);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks/1/deliveries",
    );
  });

  it("gets a delivery", () => {
    webhooks.delivery("owner/repo", 1, 2);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks/1/deliveries/2",
    );
  });

  it("redelivers a delivery", () => {
    webhooks.redeliver("owner/repo", 1, 2);
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/hooks/1/deliveries/2/attempts",
      {},
    );
  });
});
