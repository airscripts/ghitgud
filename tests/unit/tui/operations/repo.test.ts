import { describe, it, expect, vi, beforeEach } from "vitest";

import invitesService from "@/services/invites";
import repositoryService from "@/services/repository";
import repoOperations from "@/tui/operations/repo";

vi.mock("@/services/repository", () => ({
  default: {
    create: vi.fn(),
    list: vi.fn(),
    view: vi.fn(),
    clone: vi.fn(),
    update: vi.fn(),
    star: vi.fn(),
    unstar: vi.fn(),
    remove: vi.fn(),
    fork: vi.fn(),
    sync: vi.fn(),
  },
}));

vi.mock("@/services/invites", () => ({
  default: { invite: vi.fn(), grant: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui repo operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs repo.create", async () => {
    await repoOperations[0].run({
      values: { name: "new-repo", visibility: "private" },
    });
    expect(repositoryService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "new-repo", visibility: "private" }),
    );
  });

  it("runs repo.list", async () => {
    await repoOperations[1].run({ values: {} });
    expect(repositoryService.list).toHaveBeenCalled();
  });

  it("runs repo.view", async () => {
    await repoOperations[2].run({ values: {} });
    expect(repositoryService.view).toHaveBeenCalledWith("owner/repo");
  });

  it("runs repo.clone", async () => {
    await repoOperations[3].run({ values: { repo: "owner/repo" } });
    expect(repositoryService.clone).toHaveBeenCalledWith(
      "owner/repo",
      undefined,
    );
  });

  it("runs repo.archive", async () => {
    const archiveOp = repoOperations.find((o) => o.id === "repo.archive")!;
    await archiveOp.run({ values: { repo: "owner/repo" } });
    expect(repositoryService.update).toHaveBeenCalledWith("owner/repo", {
      archived: true,
    });
  });

  it("runs repo.unarchive", async () => {
    const unarchiveOp = repoOperations.find((o) => o.id === "repo.unarchive")!;
    await unarchiveOp.run({ values: { repo: "owner/repo" } });
    expect(repositoryService.update).toHaveBeenCalledWith("owner/repo", {
      archived: false,
    });
  });

  it("runs repo.rename", async () => {
    const renameOp = repoOperations.find((o) => o.id === "repo.rename")!;
    await renameOp.run({
      values: { repo: "owner/repo", newName: "new-name" },
    });
    expect(repositoryService.update).toHaveBeenCalledWith("owner/repo", {
      name: "new-name",
    });
  });

  it("runs repo.star", async () => {
    const starOp = repoOperations.find((o) => o.id === "repo.star")!;
    await starOp.run({ values: { repo: "owner/repo" } });
    expect(repositoryService.star).toHaveBeenCalledWith("owner/repo");
  });

  it("runs repo.unstar", async () => {
    const unstarOp = repoOperations.find((o) => o.id === "repo.unstar")!;
    await unstarOp.run({ values: { repo: "owner/repo" } });
    expect(repositoryService.unstar).toHaveBeenCalledWith("owner/repo");
  });

  it("runs repo.delete", async () => {
    const deleteOp = repoOperations.find((o) => o.id === "repo.delete")!;
    await deleteOp.run({ values: { repo: "owner/repo" } });
    expect(repositoryService.remove).toHaveBeenCalledWith("owner/repo");
  });

  it("runs repo.edit", async () => {
    const editOp = repoOperations.find((o) => o.id === "repo.edit")!;
    await editOp.run({
      values: {
        repo: "owner/repo",
        description: "desc",
        visibility: "private",
      },
    });
    expect(repositoryService.update).toHaveBeenCalledWith("owner/repo", {
      description: "desc",
      homepage: undefined,
      visibility: "private",
    });
  });

  it("runs repo.fork", async () => {
    const forkOp = repoOperations.find((o) => o.id === "repo.fork")!;
    await forkOp.run({ values: { repo: "owner/repo" } });
    expect(repositoryService.fork).toHaveBeenCalledWith(
      "owner/repo",
      expect.objectContaining({ clone: false }),
    );
  });

  it("runs repo.sync", async () => {
    const syncOp = repoOperations.find((o) => o.id === "repo.sync")!;
    await syncOp.run({ values: { branch: "main" } });
    expect(repositoryService.sync).toHaveBeenCalledWith("owner/repo", "main");
  });

  it("runs repo.invite", async () => {
    const inviteOp = repoOperations.find((o) => o.id === "repo.invite")!;
    await inviteOp.run({
      values: { repo: "owner/repo", user: "octocat", role: "push" },
    });
    expect(invitesService.invite).toHaveBeenCalledWith(
      "owner",
      "repo",
      "octocat",
      "push",
    );
  });

  it("runs repo.grant", async () => {
    const grantOp = repoOperations.find((o) => o.id === "repo.grant")!;
    await grantOp.run({
      values: { repo: "owner/repo", team: "devs", role: "push" },
    });
    expect(invitesService.grant).toHaveBeenCalledWith(
      "owner",
      "repo",
      "devs",
      "push",
    );
  });
});
