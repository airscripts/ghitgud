import type { MouseEvent } from "./types";

const SCROLL_SENSITIVITY = 3;
const SGR_MOUSE_PREFIX = "\u001b[<";

const BUTTONS = {
  0: "left",
  1: "middle",
  2: "right",
  3: "none",
} as const;

const parseMouseEvent = (input: string): MouseEvent | null => {
  if (!input.startsWith(SGR_MOUSE_PREFIX)) return null;

  const match = input
    .slice(SGR_MOUSE_PREFIX.length)
    .match(/^(\d+);(\d+);(\d+)([mM])/);

  if (!match) return null;
  const buttonCode = Number(match[1]);
  const x = Number(match[2]);
  const y = Number(match[3]);
  const action = match[4];

  if (
    !Number.isFinite(buttonCode) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  )
    return null;

  if (buttonCode === 64 || buttonCode === 65) {
    return {
      x,
      y,
      type: "scroll",
      direction: buttonCode === 64 ? "up" : "down",
    };
  }

  if (action === "m") {
    return { x, y, type: "release", button: "none" };
  }

  const baseButton = (buttonCode & 3) as keyof typeof BUTTONS;
  const button = BUTTONS[baseButton] ?? "none";
  const type = buttonCode & 32 ? "drag" : "press";

  return { x, y, type, button };
};

export { SCROLL_SENSITIVITY, parseMouseEvent };
