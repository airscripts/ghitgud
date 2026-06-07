import { describe, expect, it, vi } from "vitest";

import type { TuiOperation } from "@/tui/types";
import type { AppRenderProps } from "@/tui/render";
import { __testing, renderApp } from "@/tui/render";

type CreateElement = typeof import("react").createElement;

interface TestElement {
  type: unknown;
  children: unknown[];
  props: Record<string, unknown>;
}

const h = (
  type: unknown,
  props: Record<string, unknown> | null | undefined,
  ...children: unknown[]
): TestElement => ({
  type,
  props: props ?? {},
  children,
});

const Box = "Box";
const Text = "Text";

const operation: TuiOperation = {
  id: "review-list",
  workspace: "Review",
  title: "Review list",
  command: "ghg review list",
  description: "List review threads for the current pull request.",

  inputs: [
    {
      key: "repo",
      type: "string",
      required: true,
      label: "Repository",
      placeholder: "owner/repo",
    },

    {
      key: "token",
      secret: true,
      type: "string",
      label: "Token",
    },
  ],

  run: vi.fn(),
};

const props = (overrides: Partial<AppRenderProps> = {}): AppRenderProps => ({
  mode: "normal",
  running: false,
  status: "Ready.",
  result: '{"ok": true}',

  layout: {
    rows: 32,
    columns: 120,
    hintHeight: 1,
    bodyHeight: 24,
    inputWidth: 45,
    outputWidth: 68,
    navbarHeight: 1,
    inputsHeight: 11,
    contextHeight: 10,
    contextWidth: 114,
    metadataHeight: 13,
    outputContentHeight: 21,
  },

  activeField: 0,
  showHelp: false,
  paletteIndex: 0,
  paletteQuery: "",
  insertMode: false,
  confirming: false,
  isValidSize: true,
  showPalette: false,

  values: {
    token: "secret",
    repo: "owner/repo",
  },

  operation,
  contextHScroll: 0,

  statusItems: [
    {
      label: "repo",
      tone: "success",
      value: "owner/repo",
    },
  ],

  visibleOutput: {
    end: 2,
    start: 1,
    total: 2,
    scroll: 0,
    lines: ["Review list", '"ok": true'],
  },

  dashboardData: {
    branch: "main",
    tokenSet: true,
    profile: "work",
    version: "1.2.3",
    repo: "owner/repo",
  },

  blinkOn: true,
  visualAnchor: 0,
  visualCursor: 0,
  paletteOperations: [operation],
  ...overrides,
});

describe("tui render helpers", () => {
  it("should color semantic context and json lines", () => {
    expect(__testing.segmentLine("> selected", operation)).toEqual([
      { text: "> selected", color: "cyan", bold: false },
    ]);

    expect(__testing.segmentLine("Inputs", operation)).toEqual([
      { text: "Inputs", color: "blue", bold: true },
    ]);

    expect(__testing.segmentLine('"count": 3', operation)).toEqual([
      { text: "", color: "gray" },
      { text: '"count": ', color: "blue" },
      { text: "3", color: "cyan" },
    ]);

    expect(__testing.jsonLineColor('"enabled": false')).toBe("yellow");
    expect(__testing.jsonLineColor('"name": "ghg"')).toBe("green");
    expect(__testing.jsonLineColor("{")).toBe("gray");
  });

  it("should slice colored text segments without losing style metadata", () => {
    expect(
      __testing.sliceSegments(
        [
          { text: "abcdef", color: "green", bold: true },
          { text: "ghij", color: "cyan" },
        ],
        2,
        5,
      ),
    ).toEqual([
      { text: "cdef", color: "green", bold: true },
      { text: "g", color: "cyan", bold: undefined },
    ]);
  });

  it("should format input values for empty and secret fields", () => {
    const [repo, token] = operation.inputs ?? [];

    expect(__testing.asValueString(repo, undefined)).toBe("owner/repo");
    expect(__testing.asValueString(repo, "")).toBe("owner/repo");

    expect(__testing.asValueString(repo, "openai/openai")).toBe(
      "openai/openai",
    );

    expect(__testing.asValueString(token, "secret")).toBe("********");
    expect(__testing.asValueString(token, undefined)).toBe("");
  });

  it("should wrap text into fixed-width chunks", () => {
    expect(__testing.wrapText("abcdefgh", 3)).toEqual(["abc", "def", "gh"]);
    expect(__testing.wrapText("abcdefgh", 0)).toEqual(["abcdefgh"]);
  });
});

describe("tui render app", () => {
  it("should render the size warning for invalid terminals", () => {
    const rendered = renderApp(
      h as unknown as CreateElement,
      Box,
      Text,
      props({ isValidSize: false }),
    ) as unknown as TestElement;

    expect(rendered.props).toMatchObject({
      width: 120,
      height: 32,
      justifyContent: "center",
    });
  });

  it("should render the dashboard as the full terminal surface", () => {
    const rendered = renderApp(
      h as unknown as CreateElement,
      Box,
      Text,
      props({ mode: "dashboard" }),
    ) as unknown as TestElement;

    expect(rendered.props).toMatchObject({
      width: 120,
      height: 32,
      overflow: "hidden",
    });

    expect(rendered.children).toHaveLength(1);
  });

  it("should render the normal command view with body and footer", () => {
    const rendered = renderApp(
      h as unknown as CreateElement,
      Box,
      Text,
      props(),
    ) as unknown as TestElement;

    expect(rendered.props).toMatchObject({
      width: 120,
      height: 32,
      flexDirection: "column",
    });

    expect(rendered.children.length).toBeGreaterThanOrEqual(5);
  });

  it("should overlay help and command palette modals", () => {
    const help = renderApp(
      h as unknown as CreateElement,
      Box,
      Text,
      props({ showHelp: true }),
    ) as unknown as TestElement;

    const palette = renderApp(
      h as unknown as CreateElement,
      Box,
      Text,
      props({
        showPalette: true,
        paletteQuery: "review",
      }),
    ) as unknown as TestElement;

    expect(help.children.at(-1)).toMatchObject({
      props: {
        position: "absolute",
      },
    });

    expect(palette.children.at(-1)).toMatchObject({
      props: {
        position: "absolute",
      },
    });
  });
});
