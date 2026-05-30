import type { ReactNode } from "react";

import type { StatusItem } from "./status";
import type { TuiOperation } from "./types";
import type { TuiLayout, VisibleLines } from "./layout";
import { truncateEnd, truncateMiddle, formatScrollTitle } from "./layout";

const COLORS = {
  danger: "red",
  active: "blue",
  ready: "green",
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
  searchHint: (query: string) => `Search: ${query || ""}`,
  searchCommands: (query: string) => `Commands / ${query || "search"}`,

  helpHint:
    "q quit  / search  [ ] category  tab input  enter run  u/d scroll  ? help",

  statusHint:
    "  q quit  / search  [ ] category  tab input  enter run  u/d scroll",
} as const;

const CONTEXT_LINE_PATTERNS = {
  selected: "> ",
  inputsLabel: "Inputs",
  resultLabel: "Result",
  mutationLabel: "Mutation confirmation",
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

const renderContextLine = (
  ctx: RendererContext,
  line: string,
  key: string,
  operation: TuiOperation,
) =>
  text(
    ctx,
    {
      key,
      color: getContextLineColor(line),
      bold: isContextLineBold(line, operation),
      wrap: "truncate",
    },
    line,
  );

const renderContextLines = (
  ctx: RendererContext,
  visibleContext: VisibleLines,
  operation: TuiOperation,
) =>
  visibleContext.lines.map((line, index) =>
    renderContextLine(
      ctx,
      line,
      `${visibleContext.scroll}-${index}`,
      operation,
    ),
  );

const renderHeader = (ctx: RendererContext, running: boolean, status: string) =>
  box(
    ctx,
    { justifyContent: "space-between" },
    boldText(ctx, LABELS.title, COLORS.active),
    plainText(ctx, status, running ? COLORS.running : COLORS.ready),
  );

const renderHintBar = (
  ctx: RendererContext,
  searching: boolean,
  query: string,
) =>
  plainText(
    ctx,
    searching ? LABELS.searchHint(query) : LABELS.helpHint,
    COLORS.inactive,
  );

const renderBody = (
  ctx: RendererContext,
  layout: TuiLayout,
  searching: boolean,
  query: string,
  workspaceIndex: number,
  workspaces: string[],
  operation: TuiOperation,
  visibleContext: VisibleLines,
  operationRows: ReactNode[],
) => {
  const categoryRows = renderCategoryRows(
    ctx,
    workspaces,
    workspaceIndex,
    layout,
  );
  const contextLines = renderContextLines(ctx, visibleContext, operation);

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
    plainText(ctx, LABELS.statusHint, COLORS.inactive),
  );

interface AppRenderProps {
  query: string;
  status: string;
  running: boolean;
  layout: TuiLayout;
  searching: boolean;
  workspaces: string[];
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
    renderHeader(ctx, running, status),
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
      operationRows,
    ),
    renderFooter(ctx, statusItems),
  );
};

export { renderApp, renderOperationRows };
