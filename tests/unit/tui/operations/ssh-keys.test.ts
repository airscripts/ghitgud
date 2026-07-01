import { describe, it, expect, vi, beforeEach } from "vitest";

import sshKeyService from "@/services/ssh-key";
import sshKeyOperations from "@/tui/operations/ssh-keys";

vi.mock("@/services/ssh-key", () => ({
  default: { list: vi.fn(), add: vi.fn(), delete: vi.fn() },
}));

describe("tui ssh-key operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs ssh-key.list", async () => {
    await sshKeyOperations[0].run({ values: {} });
    expect(sshKeyService.list).toHaveBeenCalled();
  });

  it("runs ssh-key.add", async () => {
    await sshKeyOperations[1].run({
      values: { title: "My Key", key: "ssh-rsa AAA..." },
    });
    expect(sshKeyService.add).toHaveBeenCalledWith({
      title: "My Key",
      key: "ssh-rsa AAA...",
      file: undefined,
    });
  });

  it("runs ssh-key.delete", async () => {
    await sshKeyOperations[2].run({ values: { id: 42 } });
    expect(sshKeyService.delete).toHaveBeenCalledWith(42, { yes: true });
  });
});
