import { execFileSync } from "child_process";
import { GhitgudError } from "@/core/errors";

const copyToClipboard = (text: string): void => {
  const platform = process.platform;

  const exec = (command: string, args: string[]) => {
    execFileSync(command, args, {
      input: text,
      stdio: ["pipe", "pipe", "ignore"],
    });
  };

  if (platform === "darwin") {
    try {
      exec("pbcopy", []);
      return;
    } catch {
      // Fall through.
    }
  }

  if (platform === "win32") {
    try {
      exec("clip", []);
      return;
    } catch {
      // Fall through.
    }
  }

  if (platform === "linux") {
    try {
      exec("xclip", ["-selection", "clipboard"]);
      return;
    } catch {
      // Fall through.
    }

    try {
      exec("xsel", ["--clipboard", "--input"]);
      return;
    } catch {
      // Fall through.
    }

    try {
      exec("wl-copy", []);
      return;
    } catch {
      // Fall through.
    }
  }

  // WSL fallback.
  try {
    exec("clip.exe", []);
    return;
  } catch {
    // Fall through.
  }

  throw new GhitgudError(
    "No clipboard tool found. Install xclip, xsel, or wl-copy.",
  );
};

export { copyToClipboard };
