import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api/gists";
import git from "@/core/git";
import service from "@/services/gist";
import { GitfleetError } from "@/core/errors";
import { emptyResponse, jsonResponse } from "../helpers/response";

vi.mock("@/api/gists", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    fork: vi.fn(),
    star: vi.fn(),
    unstar: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

vi.mock("@/core/git", () => ({
  default: { cloneRepository: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

const gist = (overrides: Record<string, unknown> = {}) => ({
  id: "abc",
  public: false,
  description: "notes",
  html_url: "https://gist.github.com/abc",
  git_pull_url: "https://gist.github.com/abc.git",
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-02T00:00:00Z",
  owner: { login: "octocat" },
  files: {
    "notes.txt": {
      filename: "notes.txt",
      type: "text/plain",
      language: "Text",
      raw_url: "https://gist.githubusercontent.com/raw",
      size: 5,
      content: "hello",
    },
  },
  ...overrides,
});

describe("gist service", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitfleet-gist-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists normalized gists", async () => {
    vi.mocked(api.list).mockResolvedValue(jsonResponse([gist()]));
    const result = await service.list({ public: true, limit: 10 });
    expect(result.gists[0].files[0].filename).toBe("notes.txt");
    expect(api.list).toHaveBeenCalledWith(true, 10);
  });

  it("uses list defaults and validates limits", async () => {
    vi.mocked(api.list).mockResolvedValue(jsonResponse([]));
    await service.list();
    expect(api.list).toHaveBeenCalledWith(false, 30);
    await expect(service.list({ limit: 0 })).rejects.toThrow(
      "between 1 and 100",
    );
  });

  it("creates a gist from local files", async () => {
    const file = path.join(tempDir, "notes.txt");
    fs.writeFileSync(file, "hello", "utf8");
    vi.mocked(api.create).mockResolvedValue(jsonResponse(gist()));

    await service.create([file], { description: "notes", public: true });
    expect(api.create).toHaveBeenCalledWith({
      description: "notes",
      public: true,
      files: { "notes.txt": { content: "hello" } },
    });
  });

  it("rejects raw view of a multi-file gist without a filename", async () => {
    vi.mocked(api.get).mockResolvedValue(
      jsonResponse(
        gist({
          files: {
            "a.txt": { filename: "a.txt", content: "a" },
            "b.txt": { filename: "b.txt", content: "b" },
          },
        }),
      ),
    );
    await expect(service.view("abc", { raw: true })).rejects.toThrow(
      GitfleetError,
    );
  });

  it("renders metadata and prints one raw file", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(gist()));
    await service.view("abc");

    vi.mocked(api.get).mockResolvedValue(jsonResponse(gist()));
    const write = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    await service.view("abc", { raw: true });
    expect(write).toHaveBeenCalledWith("hello");
    write.mockRestore();
  });

  it("rejects missing, duplicate, and conflicting files", async () => {
    await expect(
      service.create([path.join(tempDir, "missing.txt")], {}),
    ).rejects.toThrow("not found");

    const first = path.join(tempDir, "a", "same.txt");
    const second = path.join(tempDir, "b", "same.txt");
    fs.mkdirSync(path.dirname(first));
    fs.mkdirSync(path.dirname(second));
    fs.writeFileSync(first, "a");
    fs.writeFileSync(second, "b");
    await expect(service.create([first, second], {})).rejects.toThrow(
      "Duplicate gist filename",
    );
    await expect(service.edit("abc", {})).rejects.toThrow(
      "At least one gist file change",
    );
    await expect(
      service.edit("abc", { add: [first], remove: ["same.txt"] }),
    ).rejects.toThrow("Cannot add and remove");
  });

  it("edits and deletes gist files", async () => {
    const file = path.join(tempDir, "added.txt");
    fs.writeFileSync(file, "new", "utf8");
    vi.mocked(api.update).mockResolvedValue(jsonResponse(gist()));
    vi.mocked(api.remove).mockResolvedValue(emptyResponse());

    await service.edit("abc", { add: [file], remove: ["old.txt"] });
    expect(api.update).toHaveBeenCalledWith("abc", {
      files: {
        "added.txt": { content: "new" },
        "old.txt": null,
      },
    });
    await service.remove("abc");
    expect(api.remove).toHaveBeenCalledWith("abc");
  });

  it("clones to an explicit destination", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(gist()));
    const destination = path.join(tempDir, "clone");
    await service.clone("abc", destination);
    expect(git.cloneRepository).toHaveBeenCalledWith(
      "https://gist.github.com/abc.git",
      { directory: destination },
    );
  });

  it("rejects an existing clone destination", async () => {
    vi.mocked(api.get).mockResolvedValue(jsonResponse(gist()));
    await expect(service.clone("abc", tempDir)).rejects.toThrow(
      "already exists",
    );
  });

  it("forks a gist", async () => {
    vi.mocked(api.fork).mockResolvedValue(jsonResponse(gist()));
    const result = await service.fork("abc");
    expect(api.fork).toHaveBeenCalledWith("abc");
    expect(result.success).toBe(true);
  });

  it("stars a gist", async () => {
    vi.mocked(api.star).mockResolvedValue(emptyResponse(204));
    const result = await service.star("abc");
    expect(result.success).toBe(true);
    expect(api.star).toHaveBeenCalledWith("abc");
  });

  it("unstars a gist", async () => {
    vi.mocked(api.unstar).mockResolvedValue(emptyResponse(204));
    const result = await service.unstar("abc");
    expect(result.success).toBe(true);
    expect(api.unstar).toHaveBeenCalledWith("abc");
  });

  it("comments on a gist", async () => {
    vi.mocked(api.createComment).mockResolvedValue(
      jsonResponse({ id: 1, body: "Nice!", created_at: "2026-01-01" }),
    );
    const result = await service.comment("abc", "Nice!");
    expect(result.success).toBe(true);
    expect(api.createComment).toHaveBeenCalledWith("abc", "Nice!");
  });
});
