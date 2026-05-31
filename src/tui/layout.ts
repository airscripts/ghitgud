interface TuiLayout {
  rows: number;
  columns: number;
  bodyHeight: number;
  hintHeight: number;
  inputWidth: number;
  inputsHeight: number;
  outputWidth: number;
  navbarHeight: number;
  contextWidth: number;
  contextHeight: number;
  metadataHeight: number;
  outputContentHeight: number;
}

interface VisibleLines {
  end: number;
  total: number;
  start: number;
  scroll: number;
  lines: string[];
}

const MIN_ROWS = 20;
const FRAME_LINES = 6;
const HINT_HEIGHT = 1;
const MIN_COLUMNS = 80;
const NAVBAR_HEIGHT = 1;
const OUTPUT_RATIO = 0.6;
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
  const contextWidth = Math.max(20, safeColumns - 6);
  const outputWidth = Math.max(20, Math.floor(contextWidth * OUTPUT_RATIO));
  const inputWidth = Math.max(20, contextWidth - outputWidth - 1);

  const bodyHeight = Math.max(
    10,
    safeRows - FRAME_LINES - NAVBAR_HEIGHT - HINT_HEIGHT,
  );

  const contextHeight = Math.max(6, bodyHeight - PANEL_CHROME_LINES);
  const metadataHeight = Math.max(6, Math.floor(bodyHeight * 0.4));
  const inputsHeight = Math.max(4, bodyHeight - metadataHeight);

  const outputContentHeight = Math.max(
    1,
    bodyHeight - PANEL_CHROME_LINES - 2,
  );

  return {
    bodyHeight,
    inputWidth,
    outputWidth,
    inputsHeight,
    contextWidth,
    contextHeight,
    metadataHeight,
    rows: safeRows,
    outputContentHeight,
    columns: safeColumns,
    hintHeight: HINT_HEIGHT,
    navbarHeight: NAVBAR_HEIGHT,
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

const scrollLine = (line: string, hScroll: number, width: number) => {
  if (line.length <= width) return line;
  const safeScroll = Math.max(0, Math.min(hScroll, line.length - width));
  return line.slice(safeScroll, safeScroll + width);
};

export {
  scrollBy,
  getLayout,
  clampScroll,
  scrollLine,
  truncateEnd,
  getMaxScroll,
  truncateMiddle,
  getVisibleLines,
  formatScrollTitle,
};

export type { TuiLayout, VisibleLines };
