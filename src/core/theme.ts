import pc from "picocolors";

export type Theme = "dark" | "light" | "auto";

interface ThemeColors {
  border: string;
  spinner: string;
  info: (text: string) => string;
  error: (text: string) => string;
  muted: (text: string) => string;
  primary: (text: string) => string;
  success: (text: string) => string;
  warning: (text: string) => string;
}

const darkTheme: ThemeColors = {
  error: pc.red,
  info: pc.blue,
  muted: pc.gray,
  border: "cyan",
  spinner: "cyan",
  primary: pc.cyan,
  success: pc.green,
  warning: pc.yellow,
};

const lightTheme: ThemeColors = {
  error: pc.red,
  info: pc.cyan,
  muted: pc.gray,
  border: "blue",
  spinner: "blue",
  primary: pc.blue,
  success: pc.green,
  warning: pc.yellow,
};

let currentTheme: Theme = "auto";
let detectedColors: ThemeColors = darkTheme;

const detectTerminalBackground = (): "dark" | "light" => {
  const colorterm = process.env.COLORTERM;
  const term = process.env.TERM;
  const colorFgbg = process.env.COLORFGBG;

  if (colorFgbg) {
    const parts = colorFgbg.split(";");

    if (parts.length >= 2) {
      const bg = parseInt(parts[1], 10);

      if (bg >= 7 && bg <= 15) {
        return "light";
      }
    }
  }

  if (colorterm?.includes("light")) {
    return "light";
  }

  if (term?.includes("light")) {
    return "light";
  }

  if (process.env.TERM_PROGRAM === "Apple_Terminal") {
    return "dark";
  }

  return "dark";
};

const getEffectiveTheme = (): "dark" | "light" => {
  if (currentTheme === "auto") {
    return detectTerminalBackground();
  }

  return currentTheme;
};

const updateColors = () => {
  detectedColors = getEffectiveTheme() === "light" ? lightTheme : darkTheme;
};

export const setTheme = (theme: Theme) => {
  currentTheme = theme;
  updateColors();
};

export const getColors = (): ThemeColors => {
  return detectedColors;
};

export const initializeTheme = () => {
  updateColors();
};
