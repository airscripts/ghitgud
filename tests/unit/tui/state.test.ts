import { describe, expect, it, vi } from "vitest";

import git from "@/core/git";
import config from "@/core/config";
import repoResolver from "@/core/repo";

import {
  asString,
  validate,
  maskValue,
  printable,
  initialValues,
  stringifyResult,
  buildContextLines,
  buildDashboardData,
} from "@/tui/state";

vi.mock("@/core/git", () => ({
  default: {
    isInsideRepo: vi.fn(),
    getCurrentBranch: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    listProfiles: vi.fn(),
    getTokenOptional: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn(),
    resolveRepos: vi.fn(),
    resolveRepoSync: vi.fn(),
  },
}));

describe("tui state", () => {
  describe("asString", () => {
    it("returns empty string for undefined", () => {
      expect(asString(undefined)).toBe("");
    });

    it("stringifies numbers and booleans", () => {
      expect(asString(42)).toBe("42");
      expect(asString(true)).toBe("true");
    });

    it("passes strings through", () => {
      expect(asString("hello")).toBe("hello");
    });
  });

  describe("initialValues", () => {
    it("sets boolean defaults to false", () => {
      const result = initialValues({
        id: "test",
        title: "Test",
        command: "ghg test",
        workspace: "Utility",
        description: "test",
        inputs: [{ key: "flag", label: "Flag", type: "boolean" }],
        run: () => null,
      });

      expect(result.flag).toBe(false);
    });

    it("uses defaultValue when provided", () => {
      const result = initialValues({
        id: "test",
        title: "Test",
        command: "ghg test",
        description: "test",
        workspace: "Utility",

        inputs: [
          { key: "name", label: "Name", type: "string", defaultValue: "foo" },
        ],
        run: () => null,
      });

      expect(result.name).toBe("foo");
    });

    it("sets string defaults to empty string", () => {
      const result = initialValues({
        id: "test",
        title: "Test",
        command: "ghg test",
        description: "test",
        workspace: "Utility",
        inputs: [{ key: "name", label: "Name", type: "string" }],
        run: () => null,
      });

      expect(result.name).toBe("");
    });

    it("returns empty object for no inputs", () => {
      const result = initialValues({
        id: "test",
        title: "Test",
        command: "ghg test",
        description: "test",
        workspace: "Utility",
        run: () => null,
      });

      expect(result).toEqual({});
    });
  });

  describe("validate", () => {
    it("returns null when all required fields are present", () => {
      const result = validate(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "test",
          workspace: "Utility",
          run: () => null,

          inputs: [
            { key: "name", label: "Name", type: "string", required: true },
          ],
        },
        { name: "alice" },
      );

      expect(result).toBeNull();
    });

    it("returns error when required field is missing", () => {
      const result = validate(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "test",
          workspace: "Utility",
          run: () => null,

          inputs: [
            { key: "name", label: "Name", type: "string", required: true },
          ],
        },
        {},
      );

      expect(result).toBe("Name is required.");
    });

    it("returns error when required field is empty string", () => {
      const result = validate(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "test",
          workspace: "Utility",
          run: () => null,

          inputs: [
            { key: "name", label: "Name", type: "string", required: true },
          ],
        },
        { name: "" },
      );

      expect(result).toBe("Name is required.");
    });

    it("skips optional fields", () => {
      const result = validate(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "test",
          workspace: "Utility",
          run: () => null,

          inputs: [
            { key: "name", label: "Name", type: "string", required: false },
          ],
        },
        {},
      );

      expect(result).toBeNull();
    });
  });

  describe("maskValue", () => {
    it("masks secret values", () => {
      expect(
        maskValue(
          { key: "token", label: "Token", type: "string", secret: true },
          "abc",
        ),
      ).toBe("********");
    });

    it("returns empty string for undefined secret", () => {
      expect(
        maskValue(
          { key: "token", label: "Token", type: "string", secret: true },
          undefined,
        ),
      ).toBe("");
    });

    it("passes non-secret through", () => {
      expect(
        maskValue({ key: "name", label: "Name", type: "string" }, "alice"),
      ).toBe("alice");
    });
  });

  describe("printable", () => {
    it("returns true for printable ASCII", () => {
      expect(printable("a")).toBe(true);
      expect(printable("A")).toBe(true);
      expect(printable("1")).toBe(true);
      expect(printable(" ")).toBe(true);
    });

    it("returns false for DEL and control chars", () => {
      expect(printable("\u007f")).toBe(false);
      expect(printable("\u0000")).toBe(false);
      expect(printable("\u001f")).toBe(false);
    });

    it("returns true for multi-char printable strings", () => {
      expect(printable("ab")).toBe(true);
      expect(printable("hello world")).toBe(true);
    });

    it("returns false for multi-char strings with control chars", () => {
      expect(printable("a\0b")).toBe(false);
      expect(printable("a\u007f")).toBe(false);
    });
  });

  describe("stringifyResult", () => {
    it("returns Done for undefined", () => {
      expect(stringifyResult(undefined)).toBe("Done.");
    });

    it("passes strings through", () => {
      expect(stringifyResult("hello")).toBe("hello");
    });

    it("JSON stringifies objects", () => {
      expect(stringifyResult({ a: 1 })).toBe('{\n  "a": 1\n}');
    });

    it("falls back to String for circular references", () => {
      const obj: Record<string, unknown> = {};
      obj.self = obj;
      expect(stringifyResult(obj)).toBe("[object Object]");
    });
  });

  describe("buildContextLines", () => {
    it("builds lines with active field marker", () => {
      const lines = buildContextLines(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "desc",
          workspace: "Utility",
          run: () => null,
          inputs: [{ key: "name", label: "Name", type: "string" }],
        },

        { name: "alice" },
        "ok",
        false,
        0,
        false,
      );

      expect(lines).toContain("> Name: alice");
      expect(lines).toContain("Test");
      expect(lines).toContain("ghg test");
      expect(lines).toContain("desc");
      expect(lines).toContain("Result");
      expect(lines).toContain("ok");
    });

    it("shows insert mode marker", () => {
      const lines = buildContextLines(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "desc",
          workspace: "Utility",
          run: () => null,
          inputs: [{ key: "name", label: "Name", type: "string" }],
        },

        { name: "alice" },
        "ok",
        false,
        0,
        true,
      );

      expect(lines).toContain("> Name: alice");
    });

    it("shows confirmation block when confirming", () => {
      const lines = buildContextLines(
        {
          id: "test",
          inputs: [],
          title: "Test",
          mutates: true,
          command: "ghg test",
          description: "desc",
          workspace: "Utility",
          run: () => null,
        },

        {},
        "ok",
        true,
        0,
        false,
      );

      expect(lines).toContain("Mutation Confirmation");
    });

    it("shows placeholder for empty values", () => {
      const lines = buildContextLines(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "desc",
          workspace: "Utility",
          run: () => null,

          inputs: [
            {
              key: "name",
              label: "Name",
              type: "string",
              placeholder: "your-name",
            },
          ],
        },

        {},
        "ok",
        false,
        0,
        false,
      );

      expect(lines).toContain("> Name: your-name");
    });

    it("shows required asterisk", () => {
      const lines = buildContextLines(
        {
          id: "test",
          title: "Test",
          command: "ghg test",
          description: "desc",
          workspace: "Utility",
          run: () => null,

          inputs: [
            { key: "name", label: "Name", type: "string", required: true },
          ],
        },

        { name: "alice" },
        "ok",
        false,
        0,
        false,
      );

      expect(lines).toContain("> Name*: alice");
    });

    it("shows No inputs when inputs array is empty", () => {
      const lines = buildContextLines(
        {
          id: "test",
          inputs: [],
          title: "Test",
          command: "ghg test",
          description: "desc",
          workspace: "Utility",
          run: () => null,
        },

        {},
        "ok",
        false,
        0,
        false,
      );

      expect(lines).toContain("No inputs.");
    });
  });

  describe("buildDashboardData", () => {
    it("should build dashboard data from config and git", () => {
      vi.mocked(config.listProfiles).mockReturnValue([
        { name: "default", active: false, hasToken: false },
        { name: "work", active: true, hasToken: true },
      ]);

      vi.mocked(config.getTokenOptional).mockReturnValue("token");
      vi.mocked(repoResolver.resolveRepoSync).mockReturnValue("owner/repo");
      vi.mocked(git.isInsideRepo).mockReturnValue(true);
      vi.mocked(git.getCurrentBranch).mockReturnValue("main");

      expect(buildDashboardData("1.2.3")).toEqual({
        branch: "main",
        tokenSet: true,
        profile: "work",
        version: "1.2.3",
        repo: "owner/repo",
      });
    });

    it("should tolerate missing config and git context", () => {
      vi.mocked(config.listProfiles).mockImplementation(() => {
        throw new Error("missing config");
      });

      vi.mocked(config.getTokenOptional).mockReturnValue(null);
      vi.mocked(repoResolver.resolveRepoSync).mockImplementation(() => {
        throw new Error("no repo");
      });

      vi.mocked(git.isInsideRepo).mockReturnValue(false);
      expect(buildDashboardData("1.2.3")).toEqual({
        repo: null,
        branch: null,
        profile: null,
        tokenSet: false,
        version: "1.2.3",
      });
    });

    it("should tolerate git branch failure inside repo", () => {
      vi.mocked(config.listProfiles).mockReturnValue([]);
      vi.mocked(config.getTokenOptional).mockReturnValue(null);
      vi.mocked(repoResolver.resolveRepoSync).mockImplementation(() => {
        throw new Error("no repo");
      });

      vi.mocked(git.isInsideRepo).mockReturnValue(true);
      vi.mocked(git.getCurrentBranch).mockImplementation(() => {
        throw new Error("git error");
      });

      expect(buildDashboardData("1.2.3")).toEqual({
        repo: null,
        branch: null,
        profile: null,
        tokenSet: false,
        version: "1.2.3",
      });
    });
  });
});
