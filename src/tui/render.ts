import figlet from "figlet";
import pc from "picocolors";
import type { ReactNode } from "react";

import type { StatusItem } from "./status";
import type { TuiLayout, VisibleLines } from "./layout";
import { truncateEnd, truncateMiddle, formatScrollTitle } from "./layout";

import type {
  Mode,
  TuiInput,
  TuiOperation,
  DashboardData,
  TuiInputValues,
} from "./types";

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
  tagline: "A better GitHub CLI that extends the official gh CLI.",
} as const;

const CONTEXT_LINE_PATTERNS = {
  selected: "> ",
  inputsLabel: "Inputs",
  resultLabel: "Result",
  mutationLabel: "Mutation Confirmation",
} as const;

const ASCII_WIDTH = 80;
const STATUS_VALUE_WIDTH = 28;
const ASCII_COLORS = [pc.magenta, pc.blue, pc.cyan, pc.blue, pc.magenta];

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
  marginBottom?: number;
  width?: number | string;
}

const renderPanel = (
  ctx: RendererContext,
  title: string,
  children: ReactNode[],
  options: PanelOptions = {},
  description?: string,
) => {
  return box(
    ctx,
    {
      paddingX: 1,
      overflow: "hidden",
      borderDimColor: true,
      width: options.width,
      borderStyle: "round",
      height: options.height,
      flexDirection: "column",
      flexGrow: options.flexGrow,
      borderColor: COLORS.inactive,
      marginRight: options.marginRight,
      marginBottom: options.marginBottom,
    },

    boldText(ctx, title, COLORS.active),
    ...(description ? [plainText(ctx, description, COLORS.inactive)] : []),
    box(ctx, { height: 1 }),
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

const asValueString = (
  input: TuiInput,
  value: string | number | boolean | undefined,
) => {
  if (input.secret) return value ? "********" : "";
  if (value === undefined || value === "") return input.placeholder ?? "-";
  return String(value);
};

const wrapText = (text: string, width: number): string[] => {
  if (width <= 0) return [text];
  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > width) {
    lines.push(remaining.slice(0, width));
    remaining = remaining.slice(width);
  }

  lines.push(remaining);
  return lines;
};

const renderHeader = (
  ctx: RendererContext,
  running: boolean,
  mode: Mode,
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

const renderHintBar = (ctx: RendererContext) => {
  return box(
    ctx,
    {
      height: 1,
      marginBottom: 1,
      overflow: "hidden",
    },

    text(
      ctx,
      { color: COLORS.inactive },
      text(ctx, { color: COLORS.accent }, "q"),
      " dashboard  ",
      text(ctx, { color: COLORS.accent }, "c"),
      " palette  ",
      text(ctx, { color: COLORS.accent }, "i"),
      " insert  ",
      text(ctx, { color: COLORS.accent }, "Enter"),
      " run  ",
      text(ctx, { color: COLORS.accent }, "?"),
      " help",
    ),
  );
};

const renderDashboard = (
  ctx: RendererContext,
  layout: TuiLayout,
  dashboardData: DashboardData,
) => {
  const art = figlet
    .textSync("Ghitgud", {
      width: ASCII_WIDTH,
      font: "Standard",
      whitespaceBreak: true,
    })
    .split("\n");

  const artWidth = Math.max(...art.map((line) => line.length));
  const artPadding = " ".repeat(
    Math.max(0, Math.floor((layout.columns - artWidth) / 2)),
  );

  const dataLines = [
    ["Profile", dashboardData.profile ?? "none"],
    ["Repository", dashboardData.repo ?? "none"],
    ["Token", dashboardData.tokenSet ? "✓ set" : "✗ none"],
    ["Branch", dashboardData.branch ?? "none"],
    ["Version", dashboardData.version],
  ] as const;

  const maxValueWidth = Math.max(
    ...dataLines.map(([, value]) => String(value).length),
  );

  const dataBlockWidth = 12 + 2 + maxValueWidth;
  const dataPadding = " ".repeat(
    Math.max(0, Math.floor((layout.columns - dataBlockWidth) / 2)),
  );

  const legend = [
    { key: "Enter", label: "start" },
    { key: "q", label: "quit" },
  ] as const;

  const legendText = legend
    .map(({ key, label }) => `${key} ${label}`)
    .join("  ");

  const legendWidth = legendText.length;
  const legendPadding = " ".repeat(
    Math.max(0, Math.floor((layout.columns - legendWidth) / 2)),
  );

  return box(
    ctx,
    {
      overflow: "hidden",
      height: layout.rows,
      width: layout.columns,
      flexDirection: "column",
      justifyContent: "center",
    },

    ...art.map((line, index) =>
      plainText(
        ctx,
        `${artPadding}${ASCII_COLORS[index % ASCII_COLORS.length](line)}`,
      ),
    ),

    box(ctx, { height: 1 }),
    ...dataLines.map(([label, value]) =>
      text(
        ctx,
        {},

        plainText(
          ctx,
          `${dataPadding}${label}`.padEnd(dataPadding.length + 12),
          COLORS.inactive,
        ),

        text(ctx, { color: COLORS.inactive }, "  "),
        label === "Token"
          ? plainText(
              ctx,
              value,
              dashboardData.tokenSet ? COLORS.success : COLORS.danger,
            )
          : plainText(ctx, value),
      ),
    ),

    box(ctx, { height: 1 }),
    text(
      ctx,
      {},
      plainText(ctx, legendPadding),

      ...legend.flatMap(({ key, label }, index) => [
        text(ctx, { color: COLORS.accent }, key),
        ` ${label}${index < legend.length - 1 ? "  " : ""}`,
      ]),
    ),
  );
};

const renderNavbar = (ctx: RendererContext) =>
  box(ctx, { height: 1, overflow: "hidden" });

const renderBody = (
  ctx: RendererContext,
  layout: TuiLayout,
  operation: TuiOperation,
  values: TuiInputValues,
  result: string,
  activeField: number,
  insertMode: boolean,
  confirming: boolean,
  visibleOutput: VisibleLines,
  contextHScroll: number,
) => {
  const outputLines = renderContextLines(
    ctx,
    visibleOutput.lines,
    operation,
    contextHScroll,
    layout.outputWidth,
    visibleOutput.scroll,
  );
  const inputs = operation.inputs ?? [];
  const inputLines = inputs.length
    ? inputs.map((input, index) => {
        const marker =
          index === activeField ? (insertMode ? "[insert]" : ">") : " ";

        return `${marker} ${input.label}: ${asValueString(
          input,
          values[input.key],
        )}${input.required ? " *" : ""}`;
      })
    : ["No inputs."];

  const descWidth = layout.inputWidth - 6;
  const wrappedDescription = wrapText(operation.description, descWidth);

  return box(
    ctx,
    {
      height: layout.bodyHeight,
      overflow: "hidden",
      flexDirection: "row",
    },
    renderPanel(
      ctx,
      formatScrollTitle("Output", visibleOutput),
      outputLines,

      {
        marginRight: 1,
        height: layout.bodyHeight,
        width: layout.outputWidth,
      },

      "Shows the output of the executed command.",
    ),
    box(
      ctx,
      {
        flexGrow: 1,
        overflow: "hidden",
        flexDirection: "column",
        height: layout.bodyHeight,
      },

      renderPanel(
        ctx,
        "Command",
        [
          boldText(ctx, operation.title, COLORS.selected),
          ...wrappedDescription.map((line) => plainText(ctx, line)),
        ],

        { height: layout.metadataHeight },
        operation.command,
      ),

      renderPanel(
        ctx,
        "Input",
        inputLines.map((line) => {
          const active = line.startsWith(">") || line.startsWith("[insert]");

          return plainText(
            ctx,
            truncateEnd(line, descWidth),
            active ? COLORS.selected : undefined,
          );
        }),

        { height: layout.inputsHeight },
        `${inputs.length} field${inputs.length === 1 ? "" : "s"} available.`,
      ),
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

const renderHelpModal = (ctx: RendererContext, layout: TuiLayout) => {
  const sections = [
    [
      "Navigation",
      [
        "q        back to dashboard / quit",
        "Enter    run / select",
        "j/k      select input",
      ],
    ],

    [
      "Modes",
      [
        "c        command palette",
        "i        insert mode",
        "Esc      exit mode / close overlay",
      ],
    ],

    ["Actions", ["Space    toggle boolean", "y/n      confirm/cancel"]],
    [
      "Context",
      [
        "u/d      vertical scroll",
        "h/l      horizontal scroll",
        "g/G      top / bottom",
      ],
    ],
  ] as const;

  return box(
    ctx,
    {
      paddingX: 2,
      paddingY: 1,
      borderStyle: "round",
      flexDirection: "column",
      backgroundColor: "black",
      borderColor: COLORS.inactive,
      width: Math.min(54, layout.columns - 4),
    },

    boldText(ctx, "Help", COLORS.active),
    plainText(ctx, "List of available keybindings.", COLORS.inactive),

    ...sections.flatMap(([title, lines]) => [
      plainText(ctx, " "),
      boldText(ctx, title, COLORS.accent),
      ...lines.map((line) => plainText(ctx, line)),
    ]),
  );
};

const renderSizeWarning = (ctx: RendererContext, layout: TuiLayout) => {
  const message = "Window too small, resize it.";

  const padding = " ".repeat(
    Math.max(0, Math.floor((layout.columns - message.length) / 2)),
  );

  return box(
    ctx,
    {
      overflow: "hidden",
      height: layout.rows,
      width: layout.columns,
      flexDirection: "column",
      justifyContent: "center",
    },
    text(ctx, { bold: true, color: COLORS.warning }, padding + message),
  );
};

const renderOverlay = (
  ctx: RendererContext,
  layout: TuiLayout,
  modal: ReactNode,
) => {
  const backdropLines = Array.from({ length: layout.rows }, () =>
    plainText(ctx, " ".repeat(layout.columns), undefined),
  );

  return box(
    ctx,
    {
      top: 0,
      left: 0,
      position: "absolute",
      width: layout.columns,
      height: layout.rows,
    },

    box(
      ctx,
      {
        top: 0,
        left: 0,
        height: layout.rows,
        position: "absolute",
        width: layout.columns,
        flexDirection: "column",
      },
      ...backdropLines,
    ),

    box(
      ctx,
      {
        top: 0,
        left: 0,
        height: layout.rows,
        position: "absolute",
        alignItems: "center",
        width: layout.columns,
        justifyContent: "center",
      },
      modal,
    ),
  );
};

const renderCommandPalette = (
  ctx: RendererContext,
  layout: TuiLayout,
  query: string,
  operations: TuiOperation[],
  selectedIndex: number,
) => {
  const maxRows = Math.max(1, Math.min(12, layout.rows - 10));

  const start = Math.max(
    0,
    Math.min(selectedIndex - maxRows + 1, operations.length - maxRows),
  );

  const visible = operations.slice(start, start + maxRows);
  return box(
    ctx,
    {
      paddingX: 2,
      paddingY: 1,
      borderStyle: "round",
      flexDirection: "column",
      backgroundColor: "black",
      borderColor: COLORS.inactive,
      width: Math.min(72, layout.columns - 4),
    },

    boldText(ctx, "Command Palette", COLORS.accent),
    plainText(ctx, `Query: ${query}`, COLORS.inactive),
    plainText(ctx, " "),

    ...visible.map((operation, index) => {
      const operationIndex = start + index;
      const selected = operationIndex === selectedIndex;

      const label = truncateEnd(
        `${selected ? ">" : " "} ${operation.title}: ${operation.description}`,
        Math.min(66, layout.columns - 10),
      );

      return selected
        ? boldText(ctx, label, COLORS.selected)
        : plainText(ctx, label);
    }),

    visible.length
      ? plainText(ctx, "")
      : plainText(ctx, "No matching commands.", COLORS.warning),

    plainText(ctx, " "),
    plainText(ctx, "Enter select  Esc close", COLORS.inactive),
  );
};

interface AppRenderProps {
  mode: Mode;
  status: string;
  result: string;
  running: boolean;
  layout: TuiLayout;
  showHelp: boolean;
  activeField: number;
  insertMode: boolean;
  confirming: boolean;
  showPalette: boolean;
  paletteQuery: string;
  paletteIndex: number;
  isValidSize: boolean;
  values: TuiInputValues;
  contextHScroll: number;
  operation: TuiOperation;
  statusItems: StatusItem[];
  visibleOutput: VisibleLines;
  dashboardData: DashboardData;
  paletteOperations: TuiOperation[];
}

const renderNormalView = (
  ctx: RendererContext,
  props: AppRenderProps,
  overlay: ReactNode = null,
) => {
  const {
    mode,
    layout,
    status,
    values,
    result,
    running,
    operation,
    insertMode,
    confirming,
    statusItems,
    activeField,
    visibleOutput,
    contextHScroll,
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
    renderNavbar(ctx),
    renderHintBar(ctx),

    renderBody(
      ctx,
      layout,
      operation,
      values,
      result,
      activeField,
      insertMode,
      confirming,
      visibleOutput,
      contextHScroll,
    ),

    renderFooter(ctx, statusItems),
    overlay,
  );
};

const renderApp = (
  h: CreateElement,
  Box: unknown,
  Text: unknown,
  props: AppRenderProps,
) => {
  const ctx = createContext(h, Box, Text);

  const {
    mode,
    layout,
    showHelp,
    showPalette,
    isValidSize,
    paletteQuery,
    paletteIndex,
    dashboardData,
    paletteOperations,
  } = props;

  if (!isValidSize) {
    return renderSizeWarning(ctx, layout);
  }

  if (mode === "dashboard") {
    return box(
      ctx,
      {
        height: layout.rows,
        width: layout.columns,
        overflow: "hidden",
      },
      renderDashboard(ctx, layout, dashboardData),
    );
  }

  if (showHelp) {
    return renderNormalView(
      ctx,
      props,
      renderOverlay(ctx, layout, renderHelpModal(ctx, layout)),
    );
  }

  if (showPalette) {
    return renderNormalView(
      ctx,
      props,

      renderOverlay(
        ctx,
        layout,

        renderCommandPalette(
          ctx,
          layout,
          paletteQuery,
          paletteOperations,
          paletteIndex,
        ),
      ),
    );
  }

  return renderNormalView(ctx, props);
};

const __testing = {
  wrapText,
  segmentLine,
  asValueString,
  jsonLineColor,
  sliceSegments,
};

export { __testing, renderApp };
export type { AppRenderProps };
