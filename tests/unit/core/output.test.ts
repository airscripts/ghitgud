import output from "@/core/output";
import logger from "@/core/logger";
import outputState from "@/core/output-state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("output", () => {
  const stdoutWrite = vi.spyOn(process.stdout, "write");
  const stderrWrite = vi.spyOn(process.stderr, "write");

  beforeEach(() => {
    outputState.setJsonOutput(false);
    stdoutWrite.mockClear();
    stderrWrite.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    outputState.setOutputMode("human");
  });

  it("should emit JSON results in json mode", () => {
    outputState.setJsonOutput(true);
    output.writeResult({ success: true, message: "pong" });

    expect(stdoutWrite).toHaveBeenCalledWith(
      '{\n  "success": true,\n  "message": "pong"\n}\n',
    );
  });

  it("should not emit JSON results in human mode", () => {
    output.writeResult({ success: true, message: "pong" });
    expect(stdoutWrite).not.toHaveBeenCalled();
  });

  it("should suppress errors in silent mode", () => {
    outputState.setSilentOutput(true);
    output.writeError("Unauthorized.", "Set a token.");

    expect(stderrWrite).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("should emit JSON errors to stderr in json mode", () => {
    outputState.setJsonOutput(true);
    output.writeError("Unauthorized.", "Set a token.");

    expect(stderrWrite).toHaveBeenCalledWith(
      '{\n  "success": false,\n  "error": "Unauthorized.",\n  "hint": "Set a token."\n}\n',
    );
  });

  it("should log human errors through the logger", () => {
    output.writeError("Unauthorized.", "Set a token.");

    expect(logger.error).toHaveBeenCalledWith("Unauthorized.");
    expect(logger.info).toHaveBeenCalledWith("Set a token.");
  });
});
