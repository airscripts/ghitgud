interface TuiLayout {
  rows: number;
  columns: number;
  bodyHeight: number;
  commandWidth: number;
  contextHeight: number;
  categoryWidth: number;
}

interface VisibleLines {
  end: number;
  total: number;
  start: number;
  scroll: number;
  lines: string[];
}

const MIN_COLUMNS = 80;
const MIN_ROWS = 20;
const FRAME_LINES = 7;
const PANEL_CHROME_LINES = 4;

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

const truncateEnd = (value: string, width: number) => {
  if (value.length <= width) return value;
  if (width <= 1) return "…";
  return `${value.slice(0, width - 1)}…`;
};

const truncateMiddle = (value: string, width: number) => {
  if (value.length <= width) return value;
  if (width <= 1) return "…";

  const available = width - 1;
  const start = Math.ceil(available / 2);
  const end = Math.floor(available / 2);

  return `${value.slice(0, start)}…${value.slice(value.length - end)}`;
};

const getLayout = (
  columns: number | undefined,
  rows: number | undefined,
): TuiLayout => {
  const safeColumns = Math.max(columns ?? 100, MIN_COLUMNS);
  const safeRows = Math.max(rows ?? 30, MIN_ROWS);
  const compact = safeColumns < 105;

  const categoryWidth = compact ? 18 : 22;
  const commandWidth = compact ? 28 : 34;
  const bodyHeight = Math.max(10, safeRows - FRAME_LINES);
  const contextHeight = Math.max(6, bodyHeight - PANEL_CHROME_LINES);

  return {
    bodyHeight,
    commandWidth,
    contextHeight,
    categoryWidth,
    rows: safeRows,
    columns: safeColumns,
  };
};

const getMaxScroll = (totalLines: number, height: number) => {
  return Math.max(0, totalLines - height);
};

const clampScroll = (scroll: number, totalLines: number, height: number) => {
  return clamp(scroll, 0, getMaxScroll(totalLines, height));
};

const getVisibleLines = (
  lines: string[],
  scroll: number,
  height: number,
): VisibleLines => {
  const safeHeight = Math.max(1, height);
  const safeScroll = clampScroll(scroll, lines.length, safeHeight);
  const visible = lines.slice(safeScroll, safeScroll + safeHeight);

  return {
    lines: visible,
    scroll: safeScroll,
    total: lines.length,
    start: lines.length ? safeScroll + 1 : 0,
    end: lines.length ? safeScroll + visible.length : 0,
  };
};

const scrollBy = (
  scroll: number,
  delta: number,
  totalLines: number,
  height: number,
) => {
  return clampScroll(scroll + delta, totalLines, height);
};

const formatScrollTitle = (title: string, visible: VisibleLines) => {
  if (visible.total <= visible.lines.length) return title;
  return `${title} ${visible.start}-${visible.end}/${visible.total}`;
};

export {
  scrollBy,
  getLayout,
  clampScroll,
  truncateEnd,
  getMaxScroll,
  truncateMiddle,
  getVisibleLines,
  formatScrollTitle,
};

export type { TuiLayout, VisibleLines };
