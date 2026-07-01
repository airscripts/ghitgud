import { describe, expect, it } from "vitest";

import { formatRepositoryRef } from "@/domain/provider";
import providerRegistry from "@/providers/registry";

describe("provider registry", () => {
  it("loads GitHub with its declared capabilities", () => {
    const provider = providerRegistry.get("github");

    expect(provider.defaultHost).toBe("github.com");
    expect(provider.capabilities().repositories).toBe(true);
    expect(providerRegistry.requireCapability("github", "wiki")).toBe(provider);
  });

  it("formats provider-neutral repository references", () => {
    expect(
      formatRepositoryRef({
        provider: "github",
        host: "github.com",
        namespace: "airscripts/tools",
        name: "gitfleet",
      }),
    ).toBe("github@github.com:airscripts/tools/gitfleet");
  });
});
