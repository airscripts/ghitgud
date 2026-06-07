import { describe, it, expect, vi, beforeEach } from "vitest";

import { copyToClipboard } from "@/tui/clipboard";

const execFileSync = vi.fn();

vi.mock("child_process", () => ({
  execFileSync: (...args: unknown[]) => execFileSync(...args),
}));

describe("tui clipboard", () => {
  beforeEach(() => {
    execFileSync.mockReset();
  });

  it("should use pbcopy on macOS", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    execFileSync.mockReturnValue(undefined);
    copyToClipboard("hello");

    expect(execFileSync).toHaveBeenCalledWith(
      "pbcopy",
      [],
      expect.objectContaining({ input: "hello" }),
    );
  });

  it("should use clip on Windows", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    execFileSync.mockReturnValue(undefined);
    copyToClipboard("hello");

    expect(execFileSync).toHaveBeenCalledWith(
      "clip",
      [],
      expect.objectContaining({ input: "hello" }),
    );
  });

  it("should use xclip on Linux", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    execFileSync.mockReturnValue(undefined);
    copyToClipboard("hello");

    expect(execFileSync).toHaveBeenCalledWith(
      "xclip",
      ["-selection", "clipboard"],
      expect.objectContaining({ input: "hello" }),
    );
  });

  it("should fallback to xsel when xclip fails on Linux", () => {
    Object.defineProperty(process, "platform", { value: "linux" });

    execFileSync
      .mockImplementationOnce(() => {
        throw new Error("xclip not found");
      })
      .mockReturnValue(undefined);

    copyToClipboard("hello");
    expect(execFileSync).toHaveBeenCalledTimes(2);

    expect(execFileSync).toHaveBeenLastCalledWith(
      "xsel",
      ["--clipboard", "--input"],
      expect.objectContaining({ input: "hello" }),
    );
  });

  it("should fallback to wl-copy when xclip and xsel fail on Linux", () => {
    Object.defineProperty(process, "platform", { value: "linux" });

    execFileSync
      .mockImplementationOnce(() => {
        throw new Error("xclip not found");
      })
      .mockImplementationOnce(() => {
        throw new Error("xsel not found");
      })
      .mockReturnValue(undefined);

    copyToClipboard("hello");
    expect(execFileSync).toHaveBeenCalledTimes(3);

    expect(execFileSync).toHaveBeenLastCalledWith(
      "wl-copy",
      [],
      expect.objectContaining({ input: "hello" }),
    );
  });

  it("should fallback to clip.exe when all Linux tools fail", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    execFileSync
      .mockImplementationOnce(() => {
        throw new Error("xclip not found");
      })
      .mockImplementationOnce(() => {
        throw new Error("xsel not found");
      })
      .mockImplementationOnce(() => {
        throw new Error("wl-copy not found");
      })
      .mockReturnValue(undefined);

    copyToClipboard("hello");
    expect(execFileSync).toHaveBeenCalledTimes(4);

    expect(execFileSync).toHaveBeenLastCalledWith(
      "clip.exe",
      [],
      expect.objectContaining({ input: "hello" }),
    );
  });

  it("should throw when no clipboard tool is available", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    execFileSync.mockImplementation(() => {
      throw new Error("not found");
    });

    expect(() => copyToClipboard("hello")).toThrow("No clipboard tool found");
  });
});
