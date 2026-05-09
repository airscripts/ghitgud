import logger from "@/core/logger";
import { describe, it, expect } from "vitest";

describe("logger", () => {
  it("should have standard log methods", () => {
    expect(typeof logger.success).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });
});