import { describe, expect, it } from "vitest";

import {
  operationFamilies,
  canonicalFamilyName,
  normalizeOperationCommand,
} from "@/operations/registry";

describe("operation registry", () => {
  it("has unique public family names", () => {
    const names = operationFamilies.map((family) => family.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("maps legacy provider terminology to Gitfleet families", () => {
    expect(canonicalFamilyName("pr")).toBe("change");
    expect(canonicalFamilyName("codespace")).toBe("dev");
    expect(canonicalFamilyName("pages")).toBe("site");
  });

  it("normalizes TUI command labels", () => {
    expect(normalizeOperationCommand("gitfleet pr list --state open")).toBe(
      "gitfleet change list --state open",
    );
    expect(normalizeOperationCommand("gitfleet workflow validate")).toBe(
      "gitfleet pipeline definition validate",
    );
    expect(normalizeOperationCommand("gitfleet audit --org example")).toBe(
      "gitfleet security audit --org example",
    );
  });

  it("normalizes the short binary name", () => {
    expect(normalizeOperationCommand("gf pr list")).toBe(
      "gitfleet change list",
    );
  });

  it.each([
    ["run list", "pipeline run list"],
    ["cache list", "pipeline cache list"],
    ["queue list", "change queue list"],
    ["milestone list", "planning milestone list"],
    ["notifications list", "inbox notifications list"],
    ["activity", "inbox activity"],
    ["mentions", "inbox mentions"],
    ["status", "inbox status"],
    ["leaks scan", "security leaks scan"],
    ["dependabot list", "security dependabot list"],
    ["compliance check", "security compliance check"],
    ["codeql list", "security codeql list"],
    ["insights traffic", "analytics repo traffic"],
    ["actions cost", "analytics pipeline cost"],
    ["org members", "access org members"],
    ["team list", "access team list"],
    ["ssh-key list", "identity ssh list"],
    ["gpg-key list", "identity gpg list"],
    ["branch protect main", "policy branch protect main"],
    ["fork sync", "repo forks sync"],
    ["react list", "review reaction list"],
    ["comment list", "review conversation list"],
  ])("normalizes %s", (legacy, canonical) => {
    expect(normalizeOperationCommand(`gitfleet ${legacy}`)).toBe(
      `gitfleet ${canonical}`,
    );
  });
});
