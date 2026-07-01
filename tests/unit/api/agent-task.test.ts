import { describe, it, expect, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    postTokenRequired: vi.fn(),
    getTokenRequired: vi.fn(),
  },
}));

import agentTaskApi from "@/api/agent-task";
import client from "@/api/client";

describe("agent-task api", () => {
  it("should call POST /copilot-tasks for create", () => {
    agentTaskApi.create("Fix the bug");
    expect(client.postTokenRequired).toHaveBeenCalledWith("/copilot-tasks", {
      description: "Fix the bug",
    });
  });

  it("should call POST /repos/:repo/copilot-tasks for create with repo", () => {
    agentTaskApi.create("Fix the bug", "owner/repo");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/copilot-tasks",
      { description: "Fix the bug" },
    );
  });

  it("should call GET /copilot-tasks for list", () => {
    agentTaskApi.list();
    expect(client.getTokenRequired).toHaveBeenCalledWith("/copilot-tasks");
  });

  it("should call GET /copilot-tasks/:id for view", () => {
    agentTaskApi.view("task-123");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/copilot-tasks/task-123",
    );
  });
});
