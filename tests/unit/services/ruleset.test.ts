import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api/rulesets";
import service from "@/services/ruleset";
import { emptyResponse, jsonResponse } from "../helpers/response";

vi.mock("@/api/rulesets", () => ({
  default: {
    listTarget: vi.fn(),
    getTarget: vi.fn(),
    checkBranch: vi.fn(),
    createTarget: vi.fn(),
    updateTarget: vi.fn(),
    deleteTarget: vi.fn(),
  },
}));
vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));
vi.mock("@/core/logger", () => ({ default: { success: vi.fn() } }));

describe("ruleset service", () => {
  let file: string;

  beforeEach(() => {
    vi.clearAllMocks();
    file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "gitfleet-ruleset-")),
      "rules.yml",
    );
    fs.writeFileSync(
      file,
      "name: Main\ntarget: branch\nenforcement: active\nrules: []\nconditions: {}\n",
    );
  });

  afterEach(() =>
    fs.rmSync(path.dirname(file), { recursive: true, force: true }),
  );

  it("validates YAML and rejects invalid definitions", () => {
    expect(service.validate(file).ruleset.name).toBe("Main");
    fs.writeFileSync(file, "name: Minimal\nrules: []\n");
    expect(service.validate(file).ruleset).toMatchObject({
      name: "Minimal",
      rules: [],
    });
    fs.writeFileSync(file, "name: Missing rules\n");
    expect(() => service.validate(file)).toThrow("rules must be an array");
  });

  it("rejects invalid target, enforcement, conditions, and missing files", () => {
    fs.writeFileSync(file, "name: Bad\ntarget: invalid\nrules: []\n");
    expect(() => service.validate(file)).toThrow("Invalid ruleset target");
    fs.writeFileSync(file, "name: Bad\nenforcement: invalid\nrules: []\n");
    expect(() => service.validate(file)).toThrow("Invalid ruleset enforcement");
    fs.writeFileSync(file, "name: Bad\nrules: []\nconditions: []\n");
    expect(() => service.validate(file)).toThrow(
      "conditions must be an object",
    );
    expect(() => service.validate(`${file}.missing`)).toThrow("not found");
  });

  it("rejects empty, unnamed, and malformed definitions", () => {
    fs.writeFileSync(file, "[]\n");
    expect(() => service.validate(file)).toThrow("must be an object");
    fs.writeFileSync(file, "rules: []\n");
    expect(() => service.validate(file)).toThrow("name is required");
    fs.writeFileSync(file, "{not-json");
    expect(() => service.validate(file)).toThrow("Invalid ruleset file");
  });

  it("lists, views, and checks rulesets", async () => {
    vi.mocked(api.listTarget).mockResolvedValue([{ id: 1, name: "Main" }]);
    vi.mocked(api.getTarget).mockResolvedValue(
      jsonResponse({ id: 1, name: "Main", rules: [] }),
    );
    vi.mocked(api.checkBranch).mockResolvedValue(
      jsonResponse([{ type: "required_status_checks", ruleset_id: 1 }]),
    );
    expect(
      (await service.list({ repository: "owner/repo" })).rulesets,
    ).toHaveLength(1);
    expect(
      (await service.view(1, { repository: "owner/repo" })).ruleset,
    ).toMatchObject({ id: 1 });
    expect((await service.check("owner/repo", "main")).rules).toHaveLength(1);
  });

  it("creates, edits, and deletes rulesets", async () => {
    vi.mocked(api.createTarget).mockResolvedValue(jsonResponse({ id: 1 }));
    vi.mocked(api.updateTarget).mockResolvedValue(jsonResponse({ id: 1 }));
    vi.mocked(api.deleteTarget).mockResolvedValue(emptyResponse());
    await service.create(file, { namespace: "acme" });
    await service.edit(1, file, { namespace: "acme" });
    await service.remove(1, { namespace: "acme" });
    expect(api.createTarget).toHaveBeenCalled();
    expect(api.updateTarget).toHaveBeenCalled();
    expect(api.deleteTarget).toHaveBeenCalled();
  });
});
