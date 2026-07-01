import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/agent-task", () => ({
  default: {
    create: vi.fn(),
    list: vi.fn(),
    view: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSection: vi.fn(),
    renderKeyValues: vi.fn(),
    writeResult: vi.fn(),
    writeValue: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/core/spinner", () => ({
  default: {
    withSpinner: vi.fn((_msg, fn) => fn()),
  },
}));

import agentTaskService from "@/services/agent-task";
import api from "@/api/agent-task";

describe("agent-task service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create an agent task", async () => {
      (api.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          id: "task-123",
          status: "queued",
          description: "Fix the bug",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          url: "https://github.com/tasks/123",
        }),
      });

      const result = await agentTaskService.create("Fix the bug");
      expect(result.success).toBe(true);
      expect(result.task.id).toBe("task-123");
    });
  });

  describe("list", () => {
    it("should list agent tasks", async () => {
      (api.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => [
          {
            id: "task-1",
            status: "completed",
            description: "Task 1",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            url: "https://github.com/tasks/1",
          },
        ],
      });

      const result = await agentTaskService.list();
      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(1);
    });

    it("should return empty list when no tasks", async () => {
      (api.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => [],
      });

      const result = await agentTaskService.list();
      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe("view", () => {
    it("should view an agent task", async () => {
      (api.view as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          id: "task-123",
          status: "completed",
          description: "Fix the bug",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          url: "https://github.com/tasks/123",
          logs: "task output",
        }),
      });

      const result = await agentTaskService.view("task-123");
      expect(result.success).toBe(true);
      expect(result.task.id).toBe("task-123");
    });
  });
});
