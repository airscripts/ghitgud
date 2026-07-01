import { describe, expect, it, vi } from "vitest";

import orgService from "@/services/org";
import orgOperations from "@/tui/operations/access-org";

vi.mock("@/services/org", () => ({
  default: {
    add: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

describe("tui operations / org", () => {
  it("should define org.members operation", () => {
    const op = orgOperations.find((o) => o.id === "org.members");
    expect(op).toBeDefined();
    expect(op?.workspace).toBe("Organization");
    expect(op?.mutates).toBeUndefined();
  });

  it("should define org.invite operation as mutating", () => {
    const op = orgOperations.find((o) => o.id === "org.invite");
    expect(op).toBeDefined();
    expect(op?.mutates).toBe(true);
  });

  it("should define org.remove operation as mutating", () => {
    const op = orgOperations.find((o) => o.id === "org.remove");
    expect(op).toBeDefined();
    expect(op?.mutates).toBe(true);
  });

  it("should call orgService.list from members operation", () => {
    const op = orgOperations.find((o) => o.id === "org.members");
    void op?.run({ values: { org: "airscripts" } });
    expect(orgService.list).toHaveBeenCalledWith("airscripts");
  });

  it("should call orgService.add from invite operation", () => {
    const op = orgOperations.find((o) => o.id === "org.invite");

    void op?.run({
      values: { org: "airscripts", user: "octocat", role: "admin" },
    });

    expect(orgService.add).toHaveBeenCalledWith(
      "airscripts",
      "octocat",
      "admin",
    );
  });

  it("should call orgService.remove from remove operation", () => {
    const op = orgOperations.find((o) => o.id === "org.remove");
    void op?.run({ values: { org: "airscripts", user: "octocat" } });
    expect(orgService.remove).toHaveBeenCalledWith("airscripts", "octocat");
  });
});
