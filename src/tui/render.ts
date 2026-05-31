import type { ReactNode } from "react";

import type { StatusItem } from "./status";
import type { TuiOperation } from "./types";
import type { TuiLayout, VisibleLines } from "./layout";
import { truncateEnd, truncateMiddle, formatScrollTitle } from "./layout";

const COLORS = {
  danger: "red",
  accent: "cyan",
  active: "blue",
  ready: "green",
  brand: "magenta",
  inactive: "gray",
  selected: "cyan",
  success: "green",
  running: "yellow",
  warning: "yellow",
} as const;

const LABELS = {
  title: "ghg",
  context: "Context",
  commands: "Commands",
  categories: "Categories",
  tagline: "A simple CLI to give superpowers to GitHub.",
  searchHint: (query: string) => `Search: ${query || ""}`,
  searchCommands: (query: string) => `Commands / ${query || "Search"}`,
} as const;

const CONTEXT_LINE_PATTERNS = {
  selected: "> ",
  inputsLabel: "Inputs",
  resultLabel: "Result",
  mutationLabel: "Mutation Confirmation",
} as const;

const TRUNCATE_PADDING = 6;
const STATUS_VALUE_WIDTH = 28;

type CreateElement = typeof import("react").createElement;

interface RendererContext {
  h: CreateElement;
  Box: unknown;
  Text: unknown;
}

const createContext = (
  h: CreateElement,
  Box: unknown,
  Text: unknown,
): RendererContext => ({ h, Box, Text });

const box = (
  ctx: RendererContext,
  props: Record<string, unknown>,
  ...children: ReactNode[]
) => ctx.h(ctx.Box as never, props, ...children);

const text = (
  ctx: RendererContext,
  props: Record<string, unknown>,
  ...children: ReactNode[]
) => ctx.h(ctx.Text as never, props, ...children);

const plainText = (ctx: RendererContext, content: string, color?: string) =>
  text(ctx, color ? { color } : {}, content);

const boldText = (ctx: RendererContext, content: string, color?: string) =>
  text(ctx, { bold: true, ...(color ? { color } : {}) }, content);

interface PanelOptions {
  height?: number;
  flexGrow?: number;
  marginRight?: number;
  width?: number | string;
}

const renderPanel = (
  ctx: RendererContext,
  title: string,
  active: boolean,
  children: ReactNode[],
  options: PanelOptions = {},
) => {
  const borderColor = active ? COLORS.active : COLORS.inactive;
  const titleColor = active ? COLORS.active : undefined;

  return box(
    ctx,
    {
      borderColor,
      paddingX: 1,
      overflow: "hidden",
      width: options.width,
      borderStyle: "round",
      height: options.height,
      flexDirection: "column",
      borderDimColor: !active,
      flexGrow: options.flexGrow,
      marginRight: options.marginRight,
    },
    boldText(ctx, title, titleColor),
    ...children,
  );
};

const resolveToneColor = (tone?: string): string => {
  if (tone === "success") return COLORS.success;
  if (tone === "warning") return COLORS.warning;
  if (tone === "danger") return COLORS.danger;
  return COLORS.inactive;
};

const renderStatusPill = (
  ctx: RendererContext,
  item: StatusItem,
  index: number,
) => {
  const prefix = index ? "  " : "";
  const color = resolveToneColor(item.tone);

  return text(
    ctx,
    { key: `${item.label}-${index}` },
    `${prefix}${item.label}: `,
    text(ctx, { color }, truncateMiddle(item.value, STATUS_VALUE_WIDTH)),
  );
};

const renderListRow = (
  ctx: RendererContext,
  label: string,
  isActive: boolean,
  maxWidth: number,
) =>
  plainText(
    ctx,
    truncateEnd(`${isActive ? ">" : " "} ${label}`, maxWidth),
    isActive ? COLORS.selected : undefined,
  );

const renderCategoryRows = (
  ctx: RendererContext,
  workspaces: string[],
  activeIndex: number,
  layout: TuiLayout,
) =>
  workspaces.map((item, index) =>
    renderListRow(
      ctx,
      item,
      index === activeIndex,
      layout.categoryWidth - TRUNCATE_PADDING,
    ),
  );

const renderOperationRows = (
  ctx: RendererContext,
  operations: TuiOperation[],
  activeOperation: TuiOperation,
  layout: TuiLayout,
) =>
  operations.map((item) =>
    renderListRow(
      ctx,
      item.title,
      item.id === activeOperation.id,
      layout.commandWidth - TRUNCATE_PADDING,
    ),
  );

const getContextLineColor = (line: string): string | undefined => {
  if (line.startsWith(CONTEXT_LINE_PATTERNS.selected)) return COLORS.selected;

  if (
    line === CONTEXT_LINE_PATTERNS.inputsLabel ||
    line === CONTEXT_LINE_PATTERNS.resultLabel
  )
    return COLORS.active;

  if (line === CONTEXT_LINE_PATTERNS.mutationLabel) return COLORS.running;
  return undefined;
};

const isContextLineBold = (line: string, operation: TuiOperation): boolean =>
  line === operation.title ||
  line === CONTEXT_LINE_PATTERNS.inputsLabel ||
  line === CONTEXT_LINE_PATTERNS.resultLabel ||
  line === CONTEXT_LINE_PATTERNS.mutationLabel;

interface Segment {
  text: string;
  color?: string;
  bold?: boolean;
}

const segmentLine = (line: string, operation: TuiOperation): Segment[] => {
  const baseColor = getContextLineColor(line);
  const baseBold = isContextLineBold(line, operation);

  if (baseColor || baseBold) {
    return [{ text: line, color: baseColor, bold: baseBold }];
  }

  const jColor = jsonLineColor(line);
  if (!jColor) {
    return [{ text: line }];
  }

  const keyMatch = line.match(/^(\s*)("[^"]+":\s*)(.*)$/);
  if (keyMatch) {
    return [
      { text: keyMatch[1], color: COLORS.inactive },
      { text: keyMatch[2], color: COLORS.active },
      { text: keyMatch[3], color: jColor },
    ];
  }

  return [{ text: line, color: jColor }];
};

const sliceSegments = (
  segments: Segment[],
  hScroll: number,
  width: number,
): Segment[] => {
  const result: Segment[] = [];
  let cursor = 0;

  for (const segment of segments) {
    const segStart = cursor;
    const segEnd = cursor + segment.text.length;

    if (segEnd <= hScroll) {
      cursor = segEnd;
      continue;
    }

    if (segStart >= hScroll + width) {
      break;
    }

    const start = Math.max(0, hScroll - segStart);
    const end = Math.min(segment.text.length, hScroll + width - segStart);

    const sliceText = segment.text.slice(start, end);

    if (sliceText.length > 0) {
      result.push({
        text: sliceText,
        bold: segment.bold,
        color: segment.color,
      });
    }

    cursor = segEnd;
  }

  return result.length > 0 ? result : [{ text: "" }];
};

const jsonLineColor = (line: string): string | undefined => {
  const trimmed = line.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("}")) {
    return COLORS.inactive;
  }

  if (trimmed.startsWith("[") || trimmed.endsWith("]")) {
    return COLORS.inactive;
  }

  const keyMatch = trimmed.match(/^\s*"([^"]+)":\s*(.*)$/);
  if (keyMatch) {
    const value = keyMatch[2].trim().replace(/,$/, "");

    if (value === "true" || value === "false") {
      return COLORS.running;
    }

    if (value === "null") {
      return COLORS.inactive;
    }

    if (value === "[" || value === "{" || value === "}") {
      return COLORS.inactive;
    }

    if (/^"/.test(value)) {
      return COLORS.ready;
    }

    if (/^-?\d/.test(value)) {
      return COLORS.selected;
    }
  }

  return undefined;
};

const renderContextLine = (
  ctx: RendererContext,
  segments: Segment[],
  key: string,
) => {
  return text(
    ctx,
    { key },
    ...segments.map((segment, index) =>
      text(
        ctx,
        {
          key: `${key}-${index}`,
          color: segment.color,
          bold: segment.bold,
        },
        segment.text,
      ),
    ),
  );
};

const renderContextLines = (
  ctx: RendererContext,
  lines: string[],
  operation: TuiOperation,
  hScroll: number,
  width: number,
  scroll: number,
) =>
  lines.map((line, index) => {
    const segments = segmentLine(line, operation);
    const visibleSegments = sliceSegments(segments, hScroll, width);
    return renderContextLine(ctx, visibleSegments, `${scroll}-${index}`);
  });

const renderHeader = (
  ctx: RendererContext,
  running: boolean,
  mode: string,
  status: string,
) => {
  const modePrefix = mode === "insert" ? "[insert] " : "";

  return box(
    ctx,
    { justifyContent: "space-between" },

    text(
      ctx,
      {},
      boldText(ctx, LABELS.title, COLORS.brand),
      plainText(ctx, `  ${LABELS.tagline}`, COLORS.inactive),
    ),

    plainText(
      ctx,
      `${modePrefix}${status}`,
      running ? COLORS.running : COLORS.ready,
    ),
  );
};

const renderHintBar = (
  ctx: RendererContext,
  searching: boolean,
  query: string,
) => {
  if (searching) {
    return plainText(ctx, LABELS.searchHint(query), COLORS.inactive);
  }

  return box(
    ctx,
    { marginBottom: 1 },
    text(
      ctx,
      { color: COLORS.inactive },
      text(ctx, { color: COLORS.accent }, "q"),
      " quit  ",
      text(ctx, { color: COLORS.accent }, "/"),
      " search  ",
      text(ctx, { color: COLORS.accent }, "[ ]"),
      " category  ",
      text(ctx, { color: COLORS.accent }, "tab"),
      " focus  ",
      text(ctx, { color: COLORS.accent }, "i"),
      " insert  ",
      text(ctx, { color: COLORS.accent }, "enter"),
      " run  ",
      text(ctx, { color: COLORS.accent }, "u/d"),
      " v-scroll  ",
      text(ctx, { color: COLORS.accent }, "h/l"),
      " h-scroll  ",
      text(ctx, { color: COLORS.accent }, "?"),
      " help",
    ),
  );
};

const renderBody = (
  ctx: RendererContext,
  layout: TuiLayout,
  searching: boolean,
  query: string,
  workspaceIndex: number,
  workspaces: string[],
  operation: TuiOperation,
  visibleContext: VisibleLines,
  contextHScroll: number,
  operationRows: ReactNode[],
) => {
  const categoryRows = renderCategoryRows(
    ctx,
    workspaces,
    workspaceIndex,
    layout,
  );
  const contextLines = renderContextLines(
    ctx,
    visibleContext.lines,
    operation,
    contextHScroll,
    layout.contextWidth,
    visibleContext.scroll,
  );

  const commandsTitle = searching
    ? LABELS.searchCommands(query)
    : LABELS.commands;

  return box(
    ctx,
    { height: layout.bodyHeight, flexDirection: "row", overflow: "hidden" },
    renderPanel(ctx, LABELS.categories, true, categoryRows, {
      marginRight: 1,
      height: layout.bodyHeight,
      width: layout.categoryWidth,
    }),

    renderPanel(ctx, commandsTitle, true, operationRows, {
      marginRight: 1,
      height: layout.bodyHeight,
      width: layout.commandWidth,
    }),

    renderPanel(
      ctx,
      formatScrollTitle(LABELS.context, visibleContext),
      true,
      contextLines,
      {
        flexGrow: 1,
        height: layout.bodyHeight,
      },
    ),
  );
};

const renderFooter = (ctx: RendererContext, statusItems: StatusItem[]) =>
  box(
    ctx,
    {
      height: 3,
      paddingX: 1,
      marginTop: 1,
      overflow: "hidden",
      borderStyle: "round",
      borderDimColor: true,
      borderColor: COLORS.inactive,
    },
    ...statusItems.map((item, index) => renderStatusPill(ctx, item, index)),
  );

interface AppRenderProps {
  mode: string;
  query: string;
  status: string;
  running: boolean;
  layout: TuiLayout;
  searching: boolean;
  workspaces: string[];
  contextHScroll: number;
  workspaceIndex: number;
  operation: TuiOperation;
  statusItems: StatusItem[];
  operationRows: ReactNode[];
  visibleContext: VisibleLines;
}

const renderApp = (
  h: CreateElement,
  Box: unknown,
  Text: unknown,
  props: AppRenderProps,
) => {
  const ctx = createContext(h, Box, Text);

  const {
    mode,
    query,
    layout,
    status,
    running,
    operation,
    searching,
    workspaces,
    statusItems,
    operationRows,
    visibleContext,
    contextHScroll,
    workspaceIndex,
  } = props;

  return box(
    ctx,
    {
      paddingX: 1,
      overflow: "hidden",
      height: layout.rows,
      width: layout.columns,
      flexDirection: "column",
    },

    renderHeader(ctx, running, mode, status),
    renderHintBar(ctx, searching, query),

    renderBody(
      ctx,
      layout,
      searching,
      query,
      workspaceIndex,
      workspaces,
      operation,
      visibleContext,
      contextHScroll,
      operationRows,
    ),

    renderFooter(ctx, statusItems),
  );
};

export { renderApp, renderOperationRows };
