import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import wikiGit from "@/core/wiki-git";
import wikiService from "@/services/wiki";

vi.mock("@/core/wiki-git", () => ({
  default: { withClone: vi.fn(), commitAndPush: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { log: vi.fn(), renderTable: vi.fn() },
}));

vi.mock("@/core/spinner", () => ({
  default: {
    withSpinner: vi.fn(async (_text, fn) => fn()),
    createSpinner: vi.fn(),
  },
}));

describe("wiki service", () => {
  let directory: string;
  let source: string;

  beforeEach(() => {
    vi.clearAllMocks();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "wiki-test-"));
    source = path.join(directory, "source.md");
    fs.writeFileSync(source, "new content");

    vi.mocked(wikiGit.withClone).mockImplementation(async (_repo, task) =>
      task(directory),
    );
  });

  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  it("lists and sorts wiki pages", async () => {
    fs.writeFileSync(path.join(directory, "Other.textile"), "other");
    fs.writeFileSync(path.join(directory, "Home.md"), "home");
    const result = await wikiService.list("owner/repo");

    expect(result.pages.map((page) => page.filename)).toEqual([
      "Home.md",
      "Other.textile",
      "source.md",
    ]);
  });

  it("views a page by normalized title", async () => {
    fs.writeFileSync(path.join(directory, "Getting-Started.md"), "hello");
    const result = await wikiService.view("owner/repo", "Getting Started");

    expect(result.page).toMatchObject({
      filename: "Getting-Started.md",
      content: "hello",
    });
  });

  it("edits, commits, and pushes an existing page", async () => {
    fs.writeFileSync(path.join(directory, "Home.md"), "old");
    const result = await wikiService.edit("owner/repo", "Home", source);
    expect(result.page.filename).toBe("Home.md");

    expect(fs.readFileSync(path.join(directory, "Home.md"), "utf8")).toBe(
      "new content",
    );

    expect(wikiGit.commitAndPush).toHaveBeenCalledWith(
      directory,
      "docs: update wiki page Home",
    );
  });

  it("creates a page using the source extension", async () => {
    const result = await wikiService.create("owner/repo", "New Page", source);
    expect(result.page.filename).toBe("New-Page.md");

    expect(wikiGit.commitAndPush).toHaveBeenCalledWith(
      directory,
      "docs: create wiki page New Page",
    );
  });

  it("preserves an explicit page extension", async () => {
    const result = await wikiService.create(
      "owner/repo",
      "Notes.textile",
      source,
    );

    expect(result.page.filename).toBe("Notes.textile");
  });

  it("deletes an existing page", async () => {
    fs.writeFileSync(path.join(directory, "Target.md"), "content");
    const result = await wikiService.delete("owner/repo", "Target");
    expect(result.page.filename).toBe("Target.md");
    expect(fs.existsSync(path.join(directory, "Target.md"))).toBe(false);

    expect(wikiGit.commitAndPush).toHaveBeenCalledWith(
      directory,
      "docs: delete wiki page Target",
    );
  });

  it("rejects deleting a nonexistent page", async () => {
    await expect(wikiService.delete("owner/repo", "Missing")).rejects.toThrow(
      "not found",
    );
  });

  it("rejects missing, duplicate, ambiguous, and invalid pages", async () => {
    await expect(wikiService.view("owner/repo", "Missing")).rejects.toThrow(
      "not found",
    );

    fs.writeFileSync(path.join(directory, "Home.md"), "home");
    await expect(
      wikiService.create("owner/repo", "Home", source),
    ).rejects.toThrow("already exists");

    fs.writeFileSync(path.join(directory, "Home.textile"), "home");
    await expect(wikiService.view("owner/repo", "Home")).rejects.toThrow(
      "ambiguous",
    );

    await expect(wikiService.view("owner/repo", "bad/name")).rejects.toThrow(
      "Invalid wiki page title",
    );
  });

  it("validates source files and translates Git failures", async () => {
    await expect(
      wikiService.create("owner/repo", "Page", path.join(directory, "none")),
    ).rejects.toThrow("not found");

    vi.mocked(wikiGit.withClone).mockRejectedValue(
      new Error("fatal: repository not found"),
    );

    await expect(wikiService.list("owner/repo")).rejects.toThrow(
      "does not exist",
    );
  });

  it("rejects directory sources and translates common Git errors", async () => {
    await expect(
      wikiService.create("owner/repo", "Page", directory),
    ).rejects.toThrow("not a file");

    vi.mocked(wikiGit.withClone).mockRejectedValue(
      new Error("fatal: authentication failed"),
    );

    await expect(wikiService.list("owner/repo")).rejects.toThrow(
      "authentication failed",
    );

    vi.mocked(wikiGit.withClone).mockRejectedValue(
      new Error("nothing to commit"),
    );

    await expect(wikiService.list("owner/repo")).rejects.toThrow("unchanged");
    vi.mocked(wikiGit.withClone).mockRejectedValue(new Error("unknown"));

    await expect(wikiService.list("owner/repo")).rejects.toThrow(
      "Git operation failed",
    );
  });
});
