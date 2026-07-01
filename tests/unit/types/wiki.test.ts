import { describe, it, expect } from "vitest";

import type { WikiPage, WikiPageContent } from "@/types/wiki";

describe("wiki types", () => {
  it("has WikiPage type with expected fields", () => {
    const page: WikiPage = {
      path: "Home",
      title: "Home",
      format: "markdown",
      filename: "Home.md",
    };

    expect(page.path).toBe("Home");
    expect(page.format).toBe("markdown");
  });

  it("has WikiPageContent type extending WikiPage", () => {
    const page: WikiPageContent = {
      path: "Getting-Started",
      title: "Getting Started",
      format: "markdown",
      filename: "Getting-Started.md",
      content: "# Welcome\n\nHello.",
    };

    expect(page.content).toBe("# Welcome\n\nHello.");
    expect(page.title).toBe("Getting Started");
  });
});
