import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepoSync: vi.fn(() => "airscripts/ghitgud"),
    resolveRepo: vi.fn(() => Promise.resolve("airscripts/ghitgud")),
    resolveRepos: vi.fn(() => Promise.resolve(["airscripts/ghitgud"])),
  },
}));

vi.mock("@/services/notifications", () => ({
  default: {
    list: vi.fn(() => Promise.resolve([])),
    markRead: vi.fn(() => Promise.resolve()),
    markDone: vi.fn(() => Promise.resolve()),
    activity: vi.fn(() => Promise.resolve([])),
    mentions: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/labels", () => ({
  default: {
    ping: vi.fn(() => "pong"),
    pull: vi.fn(() => Promise.resolve()),
    push: vi.fn(() => Promise.resolve()),
    prune: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([])),
    pullTemplate: vi.fn(() => Promise.resolve()),
    pushTemplate: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/pr", () => ({
  default: {
    create: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([])),
    view: vi.fn(() => Promise.resolve()),
    edit: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    reopen: vi.fn(() => Promise.resolve()),
    checkout: vi.fn(() => Promise.resolve()),
    diff: vi.fn(() => Promise.resolve()),
    checks: vi.fn(() => Promise.resolve()),
    lock: vi.fn(() => Promise.resolve()),
    unlock: vi.fn(() => Promise.resolve()),
    ready: vi.fn(() => Promise.resolve()),
    merge: vi.fn(() => Promise.resolve()),
    comment: vi.fn(() => Promise.resolve()),
    status: vi.fn(() => Promise.resolve()),
    push: vi.fn(() => Promise.resolve()),
    cleanup: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/stack", () => ({
  default: {
    next: vi.fn(() => Promise.resolve()),
    push: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/review", () => ({
  default: {
    apply: vi.fn(() => Promise.resolve()),
    comment: vi.fn(() => Promise.resolve()),
    resolve: vi.fn(() => Promise.resolve()),
    suggest: vi.fn(() => Promise.resolve()),
    threads: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/milestone", () => ({
  default: {
    close: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([])),
    progress: vi.fn(() => Promise.resolve({ percent: 50 })),
  },
}));

vi.mock("@/services/project", () => ({
  default: {
    board: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/issue", () => ({
  default: {
    pin: vi.fn(() => Promise.resolve()),
    view: vi.fn(() => Promise.resolve()),
    edit: vi.fn(() => Promise.resolve()),
    lock: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    unpin: vi.fn(() => Promise.resolve()),
    status: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([])),
    reopen: vi.fn(() => Promise.resolve()),
    unlock: vi.fn(() => Promise.resolve()),
    parent: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    comment: vi.fn(() => Promise.resolve()),
    transfer: vi.fn(() => Promise.resolve()),
    subtasks: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/repos/inspect", () => ({
  default: {
    inspect: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/repos/govern", () => ({
  default: {
    govern: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/repos/label", () => ({
  default: {
    label: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/repos/retire", () => ({
  default: {
    retire: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/repos/report", () => ({
  default: {
    report: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/repos/clone", () => ({
  default: {
    clone: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/insights", () => ({
  default: {
    traffic: vi.fn(() => Promise.resolve([])),
    commits: vi.fn(() => Promise.resolve([])),
    popularity: vi.fn(() => Promise.resolve([])),
    contributors: vi.fn(() => Promise.resolve([])),
    codeFrequency: vi.fn(() => Promise.resolve([])),
    participation: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/services/workflow", () => ({
  default: {
    preview: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    validate: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

vi.mock("@/services/cache", () => ({
  default: {
    download: vi.fn(() => Promise.resolve()),
    inspect: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock("@/services/run", () => ({
  default: {
    debugRun: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/auth", () => ({
  default: {
    token: vi.fn(),
    login: vi.fn(() => Promise.resolve()),
    logout: vi.fn(() => Promise.resolve()),
    status: vi.fn(() => Promise.resolve()),
    list: vi.fn(() => Promise.resolve([])),
    switch: vi.fn(() => Promise.resolve()),
    detect: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/config", () => ({
  default: {
    get: vi.fn(() => "value"),
    set: vi.fn(() => Promise.resolve()),
    unset: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/services/release", () => ({
  default: {
    bump: vi.fn(() => Promise.resolve()),
    draft: vi.fn(() => Promise.resolve()),
    verify: vi.fn(() => Promise.resolve()),
    notes: vi.fn(() => Promise.resolve([])),
    changelog: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("@/commands/proxy", () => ({
  default: {
    runProxyCapture: vi.fn(() =>
      Promise.resolve({ stdout: "ok", stderr: "", exitCode: 0 }),
    ),
  },
}));

import proxy from "@/commands/proxy";
import prService from "@/services/pr";
import runService from "@/services/run";
import authService from "@/services/auth";
import issueService from "@/services/issue";
import stackService from "@/services/stack";
import cacheService from "@/services/cache";
import reviewService from "@/services/review";
import labelsService from "@/services/labels";
import configService from "@/services/config";
import releaseService from "@/services/release";
import projectService from "@/services/project";
import insightsService from "@/services/insights";
import workflowService from "@/services/workflow";
import milestoneService from "@/services/milestone";
import reposLabelService from "@/services/repos/label";
import reposCloneService from "@/services/repos/clone";
import reposGovernService from "@/services/repos/govern";
import reposRetireService from "@/services/repos/retire";
import reposReportService from "@/services/repos/report";
import reposInspectService from "@/services/repos/inspect";
import notificationsService from "@/services/notifications";

import prOperations from "@/tui/operations/prs";
import runOperations from "@/tui/operations/run";
import authOperations from "@/tui/operations/auth";
import cacheOperations from "@/tui/operations/cache";
import labelOperations from "@/tui/operations/labels";
import issueOperations from "@/tui/operations/issues";
import reviewOperations from "@/tui/operations/review";
import configOperations from "@/tui/operations/config";
import utilityOperations from "@/tui/operations/utility";
import releaseOperations from "@/tui/operations/release";
import projectOperations from "@/tui/operations/projects";
import insightsOperations from "@/tui/operations/insights";
import workflowOperations from "@/tui/operations/workflow";
import dashboardOperations from "@/tui/operations/dashboard";
import milestoneOperations from "@/tui/operations/milestones";
import repositoryOperations from "@/tui/operations/repositories";
import notificationOperations from "@/tui/operations/notifications";

const runOp = async (
  operation: {
    run: (ctx: {
      values: Record<string, string | number | boolean>;
    }) => unknown;
  },
  values: Record<string, string | number | boolean> = {},
) => operation.run({ values });

describe("tui operations run functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dashboard", () => {
    it("runs dashboard overview", async () => {
      await runOp(dashboardOperations[0]);
      expect(notificationsService.activity).toHaveBeenCalled();
    });
  });

  describe("notifications", () => {
    it("runs notifications.list", async () => {
      await runOp(notificationOperations[0], {
        all: true,
        limit: 10,
        participating: false,
      });

      expect(notificationsService.list).toHaveBeenCalledWith({
        all: true,
        limit: 10,
        participating: false,
        repo: "airscripts/ghitgud",
      });
    });

    it("runs notifications.read", async () => {
      await runOp(notificationOperations[2], { id: "123" });
      expect(notificationsService.markRead).toHaveBeenCalledWith("123");
    });

    it("runs notifications.done", async () => {
      await runOp(notificationOperations[3], { id: "123" });
      expect(notificationsService.markDone).toHaveBeenCalledWith("123");
    });

    it("runs activity", async () => {
      await runOp(notificationOperations[4]);
      expect(notificationsService.activity).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });

    it("runs mentions", async () => {
      await runOp(notificationOperations[5]);
      expect(notificationsService.mentions).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });
  });

  describe("labels", () => {
    it("runs labels.list", async () => {
      await runOp(labelOperations[0]);
      expect(labelsService.list).toHaveBeenCalledWith("airscripts/ghitgud");
    });

    it("runs labels.pull with template", async () => {
      await runOp(labelOperations[1], { template: "conventional" });
      expect(labelsService.pullTemplate).toHaveBeenCalledWith(
        "conventional",
        "templates",
      );
    });

    it("runs labels.pull without template", async () => {
      await runOp(labelOperations[1]);
      expect(labelsService.pull).toHaveBeenCalledWith("airscripts/ghitgud");
    });

    it("runs labels.push with template", async () => {
      await runOp(labelOperations[2], { template: "base" });
      expect(labelsService.pushTemplate).toHaveBeenCalledWith(
        "base",
        "templates",
        "airscripts/ghitgud",
      );
    });

    it("runs labels.push without template", async () => {
      await runOp(labelOperations[2]);
      expect(labelsService.push).toHaveBeenCalledWith("airscripts/ghitgud");
    });

    it("runs labels.prune", async () => {
      await runOp(labelOperations[3]);
      expect(labelsService.prune).toHaveBeenCalledWith("airscripts/ghitgud");
    });
  });

  describe("prs", () => {
    it("runs pr.cleanup", async () => {
      await runOp(prOperations[0], { dryRun: true, force: false });
      expect(prService.cleanup).toHaveBeenCalledWith("airscripts/ghitgud", {
        dryRun: true,
        force: false,
      });
    });

    it("runs pr.push", async () => {
      await runOp(prOperations[1], { pr: 42, force: true });
      expect(prService.push).toHaveBeenCalledWith(
        42,
        "airscripts/ghitgud",
        true,
      );
    });

    it("runs pr.next", async () => {
      await runOp(prOperations[2], { list: true, reverse: false });
      expect(stackService.next).toHaveBeenCalledWith({
        list: true,
        reverse: false,
      });
    });

    it("runs pr.stack.create", async () => {
      await runOp(prOperations[3], { base: "main" });
      expect(stackService.create).toHaveBeenCalledWith({ base: "main" });
    });

    it("runs pr.stack.list", async () => {
      await runOp(prOperations[4]);
      expect(stackService.list).toHaveBeenCalledWith("airscripts/ghitgud");
    });

    it("runs pr.stack.update", async () => {
      await runOp(prOperations[5]);
      expect(stackService.update).toHaveBeenCalledWith("airscripts/ghitgud");
    });

    it("runs pr.stack.push", async () => {
      await runOp(prOperations[6], { title: "feat: foo", draft: true });
      expect(stackService.push).toHaveBeenCalledWith("airscripts/ghitgud", {
        draft: true,
        title: "feat: foo",
      });
    });

    it("runs pr.create with inferred branch options omitted", async () => {
      await runOp(prOperations[7], { title: "Feature", draft: true });

      expect(prService.create).toHaveBeenCalledWith("airscripts/ghitgud", {
        title: "Feature",
        body: undefined,
        base: undefined,
        head: undefined,
        draft: true,
      });
    });

    it("runs pr.merge with selected options", async () => {
      await runOp(prOperations[19], {
        pr: 42,
        method: "squash",
        deleteBranch: true,
      });

      expect(prService.merge).toHaveBeenCalledWith("airscripts/ghitgud", 42, {
        method: "squash",
        deleteBranch: true,
      });
    });
  });

  describe("review", () => {
    it("runs review.comment", async () => {
      await runOp(reviewOperations[0], {
        pr: 1,
        line: 10,
        body: "nice",
        side: "RIGHT",
        file: "src/main.ts",
      });

      expect(reviewService.comment).toHaveBeenCalledWith({
        pr: 1,
        line: 10,
        body: "nice",
        side: "RIGHT",
        file: "src/main.ts",
        repo: "airscripts/ghitgud",
      });
    });

    it("runs review.threads", async () => {
      await runOp(reviewOperations[1], { pr: 1 });
      expect(reviewService.threads).toHaveBeenCalledWith(
        1,
        "airscripts/ghitgud",
      );
    });

    it("runs review.resolve", async () => {
      await runOp(reviewOperations[2], { threadId: 100, pr: 1 });
      expect(reviewService.resolve).toHaveBeenCalledWith(
        100,
        "airscripts/ghitgud",
        1,
      );
    });

    it("runs review.suggest", async () => {
      await runOp(reviewOperations[3], {
        pr: 1,
        file: "src/main.ts",
        line: 5,
        replace: "const x = 1;",
      });

      expect(reviewService.suggest).toHaveBeenCalledWith({
        pr: 1,
        line: 5,
        repo: "airscripts/ghitgud",
        file: "src/main.ts",
        replace: "const x = 1;",
      });
    });

    it("runs review.apply", async () => {
      await runOp(reviewOperations[4], { pr: 1, push: true });
      expect(reviewService.apply).toHaveBeenCalledWith(
        1,
        "airscripts/ghitgud",
        true,
      );
    });
  });

  describe("milestones", () => {
    it("runs milestone.create", async () => {
      await runOp(milestoneOperations[0], {
        title: "v1.0",
        due: "2026-01-01",
      });

      expect(milestoneService.create).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        {
          title: "v1.0",
          due: "2026-01-01",
        },
      );
    });

    it("runs milestone.list", async () => {
      await runOp(milestoneOperations[1], { status: "closed" });
      expect(milestoneService.list).toHaveBeenCalledWith("airscripts/ghitgud", {
        status: "closed",
      });
    });

    it("runs milestone.close", async () => {
      await runOp(milestoneOperations[2], { name: "v1.0" });
      expect(milestoneService.close).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        "v1.0",
      );
    });

    it("runs milestone.progress", async () => {
      await runOp(milestoneOperations[3], { name: "v1.0" });
      expect(milestoneService.progress).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        "v1.0",
      );
    });
  });

  describe("projects", () => {
    it("runs project.board", async () => {
      await runOp(projectOperations[0], { id: 1, owner: "airscripts" });
      expect(projectService.board).toHaveBeenCalledWith("1", {
        owner: "airscripts",
      });
    });
  });

  describe("issues", () => {
    it("runs issue.subtasks.list", async () => {
      await runOp(issueOperations[0], { issue: 42 });
      expect(issueService.subtasks).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        "42",
      );
    });

    it("runs issue.subtasks.create", async () => {
      await runOp(issueOperations[1], {
        issue: 42,
        title: "sub",
        body: "body",
      });

      expect(issueService.subtasks).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        "42",
        {
          create: true,
          title: "sub",
          body: "body",
        },
      );
    });

    it("runs issue.subtasks.link", async () => {
      await runOp(issueOperations[2], { issue: 42, link: 99 });
      expect(issueService.subtasks).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        "42",
        {
          link: "99",
        },
      );
    });

    it("runs issue.parent", async () => {
      await runOp(issueOperations[3], { child: 1, parent: 2 });
      expect(issueService.parent).toHaveBeenCalledWith(
        "airscripts/ghitgud",
        "1",
        {
          parent: "2",
        },
      );
    });

    it("runs issue.create with structured values", async () => {
      await runOp(issueOperations[4], {
        title: "Bug",
        body: "Details",
        labels: "bug, urgent",
        assignees: "octocat",
        issueType: "Bug",
      });

      expect(issueService.create).toHaveBeenCalledWith("airscripts/ghitgud", {
        title: "Bug",
        body: "Details",
        labels: ["bug", "urgent"],
        assignees: ["octocat"],
        type: "Bug",
      });
    });

    it("runs issue lifecycle and status operations", async () => {
      await runOp(issueOperations[8], { issue: 42 });
      await runOp(issueOperations.at(-1)!, {});
      expect(issueService.close).toHaveBeenCalledWith("airscripts/ghitgud", 42);
      expect(issueService.status).toHaveBeenCalledWith(undefined);
    });
  });

  describe("repositories", () => {
    it("runs repos.inspect", async () => {
      await runOp(repositoryOperations[0]);
      expect(reposInspectService.inspect).toHaveBeenCalled();
    });

    it("runs repos.govern", async () => {
      await runOp(repositoryOperations[1], {
        dryRun: true,
        yes: false,
        ruleset: "./r.json",
      });

      expect(reposGovernService.govern).toHaveBeenCalledWith(
        expect.objectContaining({
          yes: false,
          dryRun: true,
          ruleset: "./r.json",
        }),
      );
    });

    it("runs repos.label", async () => {
      await runOp(repositoryOperations[2], {
        yes: false,
        dryRun: true,
        template: "base",
      });

      expect(reposLabelService.label).toHaveBeenCalledWith(
        expect.objectContaining({
          yes: false,
          dryRun: true,
          template: "base",
        }),
      );
    });

    it("runs repos.retire", async () => {
      await runOp(repositoryOperations[3], {
        yes: false,
        dryRun: true,
        months: "12",
      });

      expect(reposRetireService.retire).toHaveBeenCalledWith(
        expect.objectContaining({
          yes: false,
          dryRun: true,
          months: "12",
        }),
      );
    });

    it("runs repos.report", async () => {
      await runOp(repositoryOperations[4], { since: "7d" });
      expect(reposReportService.report).toHaveBeenCalledWith(
        expect.objectContaining({ since: "7d" }),
      );
    });

    it("runs repos.clone", async () => {
      await runOp(repositoryOperations[5], {
        dryRun: true,
        protocol: "https",
        includeForks: false,
        includePrivate: false,
      });

      expect(reposCloneService.clone).toHaveBeenCalledWith(
        expect.objectContaining({
          dryRun: true,
          protocol: "https",
          includeForks: false,
          includePrivate: false,
        }),
      );
    });
  });

  describe("insights", () => {
    it("runs insights.traffic", async () => {
      await runOp(insightsOperations[0]);
      expect(insightsService.traffic).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });

    it("runs insights.contributors", async () => {
      await runOp(insightsOperations[1]);
      expect(insightsService.contributors).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });

    it("runs insights.commits", async () => {
      await runOp(insightsOperations[2]);
      expect(insightsService.commits).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });

    it("runs insights.frequency", async () => {
      await runOp(insightsOperations[3]);
      expect(insightsService.codeFrequency).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });

    it("runs insights.popularity", async () => {
      await runOp(insightsOperations[4]);
      expect(insightsService.popularity).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });

    it("runs insights.participation", async () => {
      await runOp(insightsOperations[5]);
      expect(insightsService.participation).toHaveBeenCalledWith(
        "airscripts/ghitgud",
      );
    });
  });

  describe("workflow", () => {
    it("runs workflow.validate", async () => {
      await runOp(workflowOperations[0], { path: ".github/workflows/ci.yml" });
      expect(workflowService.validate).toHaveBeenCalledWith(
        ".github/workflows/ci.yml",
      );
    });

    it("runs workflow.preview", async () => {
      await runOp(workflowOperations[1], { path: ".github/workflows/ci.yml" });
      expect(workflowService.preview).toHaveBeenCalledWith(
        ".github/workflows/ci.yml",
      );
    });
  });

  describe("cache", () => {
    it("runs cache.inspect", async () => {
      await runOp(cacheOperations[0], { key: "abc" });
      expect(cacheService.inspect).toHaveBeenCalledWith(
        "abc",
        "airscripts/ghitgud",
      );
    });

    it("runs cache.download", async () => {
      await runOp(cacheOperations[1], {
        key: "abc",
        outputDir: "./out",
      });

      expect(cacheService.download).toHaveBeenCalledWith("abc", {
        repo: "airscripts/ghitgud",
        outputDir: "./out",
      });
    });
  });

  describe("run", () => {
    it("runs run.debug", async () => {
      await runOp(runOperations[0], {
        runId: 123,
        outputDir: "./out",
      });

      expect(runService.debugRun).toHaveBeenCalledWith(123, {
        repo: "airscripts/ghitgud",
        outputDir: "./out",
      });
    });
  });

  describe("auth", () => {
    it("runs auth.login", async () => {
      await runOp(authOperations[0], {
        token: "ghp_xxx",
      });

      expect(authService.login).toHaveBeenCalledWith("ghp_xxx", {
        profile: undefined,
      });
    });

    it("runs auth.status", async () => {
      await runOp(authOperations[1]);
      expect(authService.status).toHaveBeenCalled();
    });

    it("runs auth.list", async () => {
      await runOp(authOperations[2]);
      expect(authService.list).toHaveBeenCalled();
    });

    it("runs auth.switch", async () => {
      await runOp(authOperations[3], { name: "work" });
      expect(authService.switch).toHaveBeenCalledWith("work");
    });

    it("runs auth.detect", async () => {
      await runOp(authOperations[4]);
      expect(authService.detect).toHaveBeenCalled();
    });

    it("runs auth.token", async () => {
      await runOp(authOperations[5]);
      expect(authService.token).toHaveBeenCalledWith(false);
    });
  });

  describe("config", () => {
    it("runs config.set", async () => {
      await runOp(configOperations[0], { key: "key", value: "val" });
      expect(configService.set).toHaveBeenCalledWith("key", "val");
    });

    it("runs config.get", async () => {
      await runOp(configOperations[1], { key: "key" });
      expect(configService.get).toHaveBeenCalledWith("key");
    });

    it("runs config.unset", async () => {
      await runOp(configOperations[2], { key: "key" });
      expect(configService.unset).toHaveBeenCalledWith("key");
    });
  });

  describe("utility", () => {
    it("runs ping", async () => {
      await runOp(utilityOperations[0]);
      expect(labelsService.ping).toHaveBeenCalled();
    });

    it("runs version", async () => {
      const result = await runOp(utilityOperations[1]);
      expect(result).toEqual({ success: true, version: __VERSION__ });
    });

    it("runs proxy with stderr output", async () => {
      vi.mocked(proxy.runProxyCapture).mockResolvedValueOnce({
        stdout: "",
        exitCode: 1,
        stderr: "error",
      });

      const result = await runOp(utilityOperations[2], { args: "repo list" });
      expect(proxy.runProxyCapture).toHaveBeenCalledWith(["repo", "list"]);
      expect(result).toBe("error");
    });

    it("runs proxy with exit code fallback", async () => {
      vi.mocked(proxy.runProxyCapture).mockResolvedValueOnce({
        stdout: "",
        stderr: "",
        exitCode: 2,
      });

      const result = await runOp(utilityOperations[2], { args: "repo list" });
      expect(result).toBe("Exited with code 2.");
    });
  });

  describe("release", () => {
    it("runs release.changelog with defaults", async () => {
      await runOp(releaseOperations[0]);
      expect(releaseService.changelog).toHaveBeenCalledWith({
        to: undefined,
        since: undefined,
      });
    });

    it("runs release.changelog", async () => {
      await runOp(releaseOperations[0], { since: "v1.0", to: "HEAD" });
      expect(releaseService.changelog).toHaveBeenCalledWith({
        to: "HEAD",
        since: "v1.0",
      });
    });

    it("runs release.bump", async () => {
      await runOp(releaseOperations[1], {
        push: false,
        create: true,
        level: "patch",
      });

      expect(releaseService.bump).toHaveBeenCalledWith({
        push: false,
        create: true,
        level: "patch",
      });
    });

    it("runs release.verify", async () => {
      await runOp(releaseOperations[2], { tag: "v1.0" });
      expect(releaseService.verify).toHaveBeenCalledWith("v1.0", {
        repo: "airscripts/ghitgud",
      });
    });

    it("runs release.notes with defaults", async () => {
      await runOp(releaseOperations[3]);
      expect(releaseService.notes).toHaveBeenCalledWith({
        out: undefined,
        since: undefined,
        templateFile: undefined,
        repo: "airscripts/ghitgud",
      });
    });

    it("runs release.notes", async () => {
      await runOp(releaseOperations[3], {
        out: "o.md",
        since: "v1.0",
        template: "t.md",
      });

      expect(releaseService.notes).toHaveBeenCalledWith({
        out: "o.md",
        since: "v1.0",
        templateFile: "t.md",
        repo: "airscripts/ghitgud",
      });
    });

    it("runs release.draft", async () => {
      await runOp(releaseOperations[4], {
        title: "v1.1",
        level: "minor",
        notes: "generated",
      });

      expect(releaseService.draft).toHaveBeenCalledWith({
        title: "v1.1",
        level: "minor",
        notes: "generated",
        repo: "airscripts/ghitgud",
      });
    });
  });
});
