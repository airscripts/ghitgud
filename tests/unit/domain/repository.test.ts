import { describe, expect, it } from "vitest";

import { ConfigError } from "@/core/errors";
import { repositoryRefFromRemote } from "@/domain/repository";

describe("repositoryRefFromRemote", () => {
  it.each([
    "git@github.com:airscripts/gitfleet.git",
    "ssh://git@github.com/airscripts/gitfleet.git",
    "https://github.com/airscripts/gitfleet.git",
  ])("parses %s", (remote) => {
    expect(repositoryRefFromRemote(remote)).toEqual({
      provider: "github",
      host: "github.com",
      namespace: "airscripts",
      name: "gitfleet",
    });
  });

  it("rejects unsupported provider hosts", () => {
    expect(() =>
      repositoryRefFromRemote("git@example.com:owner/repo.git"),
    ).toThrow(ConfigError);
  });

  it("parses configured GitHub Enterprise hosts", () => {
    expect(
      repositoryRefFromRemote("git@github.example.com:platform/tools.git", {
        "github.example.com": "github",
      }),
    ).toEqual({
      provider: "github",
      host: "github.example.com",
      namespace: "platform",
      name: "tools",
    });
  });
});
