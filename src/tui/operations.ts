import config from "@/core/config";
import proxy from "@/commands/proxy";
import prService from "@/services/pr";
import runService from "@/services/run";
import cacheService from "@/services/cache";
import issueService from "@/services/issue";
import stackService from "@/services/stack";
import { GhitgudError } from "@/core/errors";
import labelsService from "@/services/labels";
import configService from "@/services/config";
import reviewService from "@/services/review";
import projectService from "@/services/project";
import profileService from "@/services/profile";
import releaseService from "@/services/release";
import insightsService from "@/services/insights";
import workflowService from "@/services/workflow";
import milestoneService from "@/services/milestone";
import { type BumpLevel } from "@/core/conventional";
import reposLabelService from "@/services/repos/label";
import reposGovernService from "@/services/repos/govern";
import reposReportService from "@/services/repos/report";
import reposRetireService from "@/services/repos/retire";
import reposInspectService from "@/services/repos/inspect";
import notificationsService from "@/services/notifications";
import type { TuiInput, TuiInputValues, TuiOperation } from "./types";

const repoInput: TuiInput = {
  key: "repo",
  type: "string",
  label: "Repository",
  placeholder: "owner/repo",
};

const orgInput: TuiInput = {
  key: "org",
  type: "string",
  label: "Organization",
};

const reposInput: TuiInput = {
  key: "repos",
  type: "string",
  label: "Repositories",
  placeholder: "owner/a,owner/b",
};

const fileInput: TuiInput = {
  key: "file",
  type: "string",
  label: "Repo file",
};

const limitInput: TuiInput = {
  key: "limit",
  type: "number",
  label: "Limit",
};

const targetInputs = [orgInput, reposInput, fileInput, limitInput];

const text = (values: TuiInputValues, key: string): string | undefined => {
  const value = values[key];
  if (value === undefined || value === "") return undefined;
  return String(value);
};

const requiredText = (values: TuiInputValues, key: string): string => {
  const value = text(values, key);
  if (!value) throw new GhitgudError(`Missing required input: ${key}.`);
  return value;
};

const numberValue = (values: TuiInputValues, key: string): number => {
  const value = Number(values[key]);
  if (Number.isNaN(value)) throw new GhitgudError(`Invalid number: ${key}.`);
  return value;
};

const booleanValue = (values: TuiInputValues, key: string): boolean => {
  return values[key] === true || values[key] === "true";
};

const targetOptions = (values: TuiInputValues) => ({
  org: text(values, "org"),
  file: text(values, "file"),
  repos: text(values, "repos"),
  limit: text(values, "limit"),
});

const repoValue = (values: TuiInputValues) => {
  return text(values, "repo") ?? config.getRepo();
};

const operations: TuiOperation[] = [
  {
    command: "ghg tui",
    workspace: "Dashboard",
    id: "dashboard.overview",
    title: "Dashboard Overview",
    description: "Show active profile, configured repo, and activity summary.",

    run: async () => ({
      repo: config.getRepoOptional(),
      profiles: config.listProfiles(),
      activity: await notificationsService.activity(),
    }),
  },

  {
    id: "notifications.list",
    workspace: "Notifications",
    title: "List Notifications",
    command: "ghg notifications list",
    description: "List GitHub notifications.",

    inputs: [
      { key: "all", label: "Include read", type: "boolean" },
      { key: "participating", label: "Participating only", type: "boolean" },
      repoInput,
      { key: "limit", label: "Limit", type: "number" },
    ],

    run: ({ values }) =>
      notificationsService.list({
        repo: text(values, "repo"),
        all: booleanValue(values, "all"),
        participating: booleanValue(values, "participating"),
        limit: text(values, "limit") ? numberValue(values, "limit") : undefined,
      }),
  },

  {
    mutates: true,
    id: "notifications.read",
    workspace: "Notifications",
    title: "Mark Notification Read",
    command: "ghg notifications read <id>",
    description: "Mark a notification as read.",

    inputs: [
      { key: "id", label: "Notification ID", type: "string", required: true },
    ],

    run: ({ values }) =>
      notificationsService.markRead(requiredText(values, "id")),
  },

  {
    mutates: true,
    id: "notifications.done",
    workspace: "Notifications",
    title: "Mark Notification Done",
    command: "ghg notifications done <id>",
    description: "Mark a notification as done.",

    inputs: [
      { key: "id", label: "Notification ID", type: "string", required: true },
    ],

    run: ({ values }) =>
      notificationsService.markDone(requiredText(values, "id")),
  },

  {
    id: "activity",
    title: "Activity",
    command: "ghg activity",
    workspace: "Notifications",
    description: "Load assigned issues, review requests, and mentions.",
    run: () => notificationsService.activity(),
  },

  {
    id: "mentions",
    title: "Mentions",
    command: "ghg mentions",
    workspace: "Notifications",
    description: "Load recent @mentions.",
    run: () => notificationsService.mentions(),
  },

  {
    id: "labels.list",
    workspace: "Labels",
    title: "List Labels",
    command: "ghg labels list",
    description: "List repository labels.",
    run: () => labelsService.list(),
  },

  {
    mutates: true,
    id: "labels.pull",
    workspace: "Labels",
    title: "Pull Labels",
    command: "ghg labels pull",
    description: "Save repository labels to local metadata.",
    inputs: [{ key: "template", label: "Template", type: "string" }],

    run: ({ values }) => {
      const template = text(values, "template");

      return template
        ? labelsService.pullTemplate(template, "templates")
        : labelsService.pull();
    },
  },

  {
    mutates: true,
    id: "labels.push",
    workspace: "Labels",
    title: "Push Labels",
    command: "ghg labels push",
    description: "Sync local or template labels to the repository.",
    inputs: [{ key: "template", label: "Template", type: "string" }],

    run: ({ values }) => {
      const template = text(values, "template");

      return template
        ? labelsService.pushTemplate(template, "templates")
        : labelsService.push();
    },
  },

  {
    mutates: true,
    id: "labels.prune",
    workspace: "Labels",
    title: "Prune Labels",
    command: "ghg labels prune",
    description: "Delete labels listed in local metadata.",
    run: () => labelsService.prune(),
  },

  {
    mutates: true,
    id: "pr.cleanup",
    workspace: "PRs",
    dryRunDefault: true,
    command: "ghg pr cleanup",
    title: "Clean Merged PR Branches",
    description: "Delete merged local/remote branches and fast-forward base.",

    inputs: [
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "force", label: "Force", type: "boolean" },
    ],

    run: ({ values }) =>
      prService.cleanup({
        dryRun: booleanValue(values, "dryRun"),
        force: booleanValue(values, "force"),
      }),
  },

  {
    id: "pr.push",
    mutates: true,
    workspace: "PRs",
    title: "Push to PR Fork",
    command: "ghg pr push <number>",
    description: "Push current branch to a contributor fork.",

    inputs: [
      { key: "pr", label: "PR number", type: "number", required: true },
      { key: "force", label: "Force", type: "boolean" },
    ],

    run: ({ values }) =>
      prService.push(numberValue(values, "pr"), booleanValue(values, "force")),
  },

  {
    id: "pr.next",
    mutates: true,
    workspace: "PRs",
    title: "Stack Next",
    command: "ghg pr next",
    description: "Move through a tracked PR stack.",

    inputs: [
      { key: "reverse", label: "Reverse", type: "boolean" },
      { key: "list", label: "List only", type: "boolean" },
    ],

    run: ({ values }) =>
      stackService.next({
        list: booleanValue(values, "list"),
        reverse: booleanValue(values, "reverse"),
      }),
  },

  {
    mutates: true,
    workspace: "PRs",
    id: "pr.stack.create",
    title: "Create Stack",
    command: "ghg pr stack create",
    description: "Create a stack from the current branch.",

    inputs: [
      {
        key: "base",
        type: "string",
        label: "Base branch",
        defaultValue: "auto",
      },
    ],

    run: ({ values }) => stackService.create({ base: text(values, "base") }),
  },

  {
    workspace: "PRs",
    id: "pr.stack.list",
    title: "List Stack",
    command: "ghg pr stack list",
    description: "Show current stack status.",
    run: () => stackService.list(),
  },

  {
    mutates: true,
    workspace: "PRs",
    id: "pr.stack.update",
    title: "Update Stack",
    command: "ghg pr stack update",
    description: "Update an existing stack after parent PR merges.",
    run: () => stackService.update(),
  },

  {
    mutates: true,
    workspace: "PRs",
    id: "pr.stack.push",
    title: "Push Stack",
    command: "ghg pr stack push",
    description: "Push a stack and create/update PRs.",

    inputs: [
      {
        key: "title",
        type: "string",
        label: "Title template",
        defaultValue: "feat: {branch}",
      },
      { key: "draft", label: "Draft", type: "boolean" },
    ],

    run: ({ values }) =>
      stackService.push({
        title: text(values, "title"),
        draft: booleanValue(values, "draft"),
      }),
  },

  {
    mutates: true,
    workspace: "Review",
    id: "review.comment",
    title: "Review Comment",
    command: "ghg review comment <pr>",
    description: "Create a line review comment.",

    inputs: [
      { key: "pr", label: "PR number", type: "number", required: true },
      { key: "file", label: "File", type: "string", required: true },
      { key: "line", label: "Line", type: "number", required: true },
      { key: "body", label: "Body", type: "string", required: true },
      { key: "side", label: "Side", type: "string", defaultValue: "RIGHT" },
      repoInput,
    ],

    run: ({ values }) =>
      reviewService.comment({
        repo: text(values, "repo"),
        pr: numberValue(values, "pr"),
        line: numberValue(values, "line"),
        file: requiredText(values, "file"),
        body: requiredText(values, "body"),
        side: requiredText(values, "side") as "LEFT" | "RIGHT",
      }),
  },

  {
    workspace: "Review",
    id: "review.threads",
    title: "Review Threads",
    command: "ghg review threads <pr>",
    description: "List review threads for a PR.",

    inputs: [
      { key: "pr", label: "PR number", type: "number", required: true },
      repoInput,
    ],

    run: ({ values }) =>
      reviewService.threads(numberValue(values, "pr"), text(values, "repo")),
  },

  {
    mutates: true,
    workspace: "Review",
    id: "review.resolve",
    title: "Resolve Review Thread",
    command: "ghg review resolve <thread-id> <pr>",
    description: "Mark a review thread as resolved.",

    inputs: [
      { key: "threadId", label: "Thread ID", type: "number", required: true },
      { key: "pr", label: "PR number", type: "number", required: true },
      repoInput,
    ],

    run: ({ values }) =>
      reviewService.resolve(
        numberValue(values, "threadId"),
        text(values, "repo"),
        numberValue(values, "pr"),
      ),
  },

  {
    mutates: true,
    workspace: "Review",
    id: "review.suggest",
    title: "Review Suggestion",
    command: "ghg review suggest <pr>",
    description: "Create a single-line suggestion.",

    inputs: [
      { key: "pr", label: "PR number", type: "number", required: true },
      { key: "file", label: "File", type: "string", required: true },
      { key: "line", label: "Line", type: "number", required: true },
      { key: "replace", label: "Replacement", type: "string", required: true },
      repoInput,
    ],

    run: ({ values }) =>
      reviewService.suggest({
        repo: text(values, "repo"),
        pr: numberValue(values, "pr"),
        line: numberValue(values, "line"),
        file: requiredText(values, "file"),
        replace: requiredText(values, "replace"),
      }),
  },

  {
    mutates: true,
    id: "review.apply",
    workspace: "Review",
    title: "Apply Suggestions",
    command: "ghg review apply <pr>",
    description: "Apply review suggestions locally.",

    inputs: [
      { key: "pr", label: "PR number", type: "number", required: true },
      repoInput,
      { key: "push", label: "Push", type: "boolean" },
    ],

    run: ({ values }) =>
      reviewService.apply(
        numberValue(values, "pr"),
        text(values, "repo"),
        booleanValue(values, "push"),
      ),
  },

  {
    mutates: true,
    id: "milestone.create",
    workspace: "Milestones",
    title: "Create Milestone",
    command: "ghg milestone create",
    description: "Create a repository milestone with a due date.",

    inputs: [
      { key: "title", label: "Title", type: "string", required: true },

      {
        key: "due",
        type: "string",
        label: "Due date",
        required: true,
        placeholder: "2026-06-30",
      },
    ],

    run: ({ values }) =>
      milestoneService.create({
        due: requiredText(values, "due"),
        title: requiredText(values, "title"),
      }),
  },

  {
    id: "milestone.list",
    workspace: "Milestones",
    title: "List Milestones",
    command: "ghg milestone list",
    description: "List open or closed repository milestones.",

    inputs: [
      {
        key: "status",
        type: "string",
        label: "Status",
        defaultValue: "open",
        placeholder: "open or closed",
      },
    ],

    run: ({ values }) =>
      milestoneService.list({
        status: (text(values, "status") ?? "open") as "open" | "closed",
      }),
  },

  {
    mutates: true,
    id: "milestone.close",
    workspace: "Milestones",
    title: "Close Milestone",
    command: "ghg milestone close <name>",
    description: "Close a milestone by exact title.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],
    run: ({ values }) => milestoneService.close(requiredText(values, "name")),
  },

  {
    workspace: "Milestones",
    id: "milestone.progress",
    title: "Milestone Progress",
    command: "ghg milestone progress <name>",
    description: "Show milestone completion percentage.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],

    run: ({ values }) =>
      milestoneService.progress(requiredText(values, "name")),
  },

  {
    id: "project.board",
    workspace: "Projects",
    title: "Project Board",
    command: "ghg project board <id>",
    description: "Render a GitHub Projects v2 kanban board.",

    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
    ],

    run: ({ values }) =>
      projectService.board(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
      }),
  },

  {
    workspace: "Issues",
    title: "List Sub-Issues",
    id: "issue.subtasks.list",
    command: "ghg issue subtasks <issue>",
    description: "List sub-issues for a parent issue.",

    inputs: [
      { key: "issue", label: "Parent issue", type: "number", required: true },
    ],

    run: ({ values }) =>
      issueService.subtasks(String(numberValue(values, "issue"))),
  },

  {
    mutates: true,
    workspace: "Issues",
    title: "Create Sub-Issue",
    id: "issue.subtasks.create",
    command: "ghg issue subtasks <issue> --create",
    description: "Create a new issue and link it as a sub-issue.",

    inputs: [
      { key: "issue", label: "Parent issue", type: "number", required: true },
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
    ],

    run: ({ values }) =>
      issueService.subtasks(String(numberValue(values, "issue")), {
        create: true,
        body: text(values, "body"),
        title: requiredText(values, "title"),
      }),
  },

  {
    mutates: true,
    workspace: "Issues",
    title: "Link Sub-Issue",
    id: "issue.subtasks.link",
    command: "ghg issue subtasks <issue> --link <issue>",
    description: "Link an existing issue as a sub-issue.",

    inputs: [
      { key: "issue", label: "Parent issue", type: "number", required: true },
      { key: "link", label: "Child issue", type: "number", required: true },
    ],

    run: ({ values }) =>
      issueService.subtasks(String(numberValue(values, "issue")), {
        link: String(numberValue(values, "link")),
      }),
  },

  {
    mutates: true,
    id: "issue.parent",
    workspace: "Issues",
    title: "Set Issue Parent",
    command: "ghg issue parent <child> --parent <parent>",
    description: "Link an existing issue to a parent issue.",

    inputs: [
      { key: "child", label: "Child issue", type: "number", required: true },
      { key: "parent", label: "Parent issue", type: "number", required: true },
    ],

    run: ({ values }) =>
      issueService.parent(String(numberValue(values, "child")), {
        parent: String(numberValue(values, "parent")),
      }),
  },

  {
    id: "repos.inspect",
    inputs: targetInputs,
    workspace: "Repositories",
    command: "ghg repos inspect",
    title: "Inspect Repositories",
    description: "Inspect repository governance files.",
    run: ({ values }) => reposInspectService.inspect(targetOptions(values)),
  },

  {
    mutates: true,
    id: "repos.govern",
    dryRunDefault: true,
    workspace: "Repositories",
    command: "ghg repos govern",
    title: "Govern Repositories",
    description: "Apply repository rulesets.",

    inputs: [
      ...targetInputs,
      { key: "ruleset", label: "Ruleset path", type: "string" },
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "yes", label: "Apply", type: "boolean" },
    ],

    run: ({ values }) =>
      reposGovernService.govern({
        ...targetOptions(values),
        ruleset: text(values, "ruleset"),
        yes: booleanValue(values, "yes"),
        dryRun: booleanValue(values, "dryRun"),
      }),
  },

  {
    mutates: true,
    id: "repos.label",
    dryRunDefault: true,
    workspace: "Repositories",
    command: "ghg repos label",
    title: "Label Repositories",
    description: "Sync labels across repository targets.",

    inputs: [
      ...targetInputs,
      { key: "template", label: "Template", type: "string" },
      { key: "metadata", label: "Metadata path", type: "string" },
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "yes", label: "Apply", type: "boolean" },
    ],

    run: ({ values }) =>
      reposLabelService.label({
        ...targetOptions(values),
        yes: booleanValue(values, "yes"),
        template: text(values, "template"),
        metadata: text(values, "metadata"),
        dryRun: booleanValue(values, "dryRun"),
      }),
  },

  {
    mutates: true,
    id: "repos.retire",
    dryRunDefault: true,
    workspace: "Repositories",
    command: "ghg repos retire",
    title: "Retire Repositories",
    description: "Find and optionally archive inactive repositories.",

    inputs: [
      ...targetInputs,
      {
        key: "months",
        type: "number",
        defaultValue: 12,
        label: "Inactive months",
      },
      { key: "includeForks", label: "Include forks", type: "boolean" },
      { key: "includePrivate", label: "Include private", type: "boolean" },
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "yes", label: "Apply", type: "boolean" },
    ],

    run: ({ values }) =>
      reposRetireService.retire({
        ...targetOptions(values),
        months: text(values, "months"),
        yes: booleanValue(values, "yes"),
        dryRun: booleanValue(values, "dryRun"),
        includeForks: booleanValue(values, "includeForks"),
        includePrivate: booleanValue(values, "includePrivate"),
      }),
  },

  {
    id: "repos.report",
    workspace: "Repositories",
    title: "Repository Report",
    command: "ghg repos report",
    description: "Report repository health and velocity.",
    inputs: [...targetInputs, { key: "since", label: "Since", type: "string" }],

    run: ({ values }) =>
      reposReportService.report({
        ...targetOptions(values),
        since: text(values, "since"),
      }),
  },

  {
    workspace: "Insights",
    id: "insights.traffic",
    title: "Traffic Insights",
    command: "ghg insights traffic",
    description: "Show repository traffic.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.traffic(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.contributors",
    title: "Contributor Insights",
    command: "ghg insights contributors",
    description: "Show top contributors.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.contributors(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.commits",
    title: "Commit Insights",
    command: "ghg insights commits",
    description: "Show commit activity.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.commits(repoValue(values)),
  },

  {
    workspace: "Insights",
    title: "Code Frequency",
    id: "insights.frequency",
    command: "ghg insights frequency",
    description: "Show code frequency.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.codeFrequency(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.popularity",
    title: "Popularity Insights",
    command: "ghg insights popularity",
    description: "Show referrers and popular paths.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.popularity(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.participation",
    title: "Participation Insights",
    command: "ghg insights participation",
    description: "Show participation stats.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.participation(repoValue(values)),
  },

  {
    workspace: "Workflow",
    id: "workflow.validate",
    title: "Validate Workflows",
    command: "ghg workflow validate",
    description: "Validate GitHub Actions workflow files.",
    inputs: [{ key: "path", label: "Path", type: "string" }],
    run: ({ values }) => workflowService.validate(text(values, "path")),
  },

  {
    workspace: "Workflow",
    id: "workflow.preview",
    title: "Preview Workflows",
    command: "ghg workflow preview",
    description: "Preview GitHub Actions workflow structure.",
    inputs: [{ key: "path", label: "Path", type: "string" }],
    run: ({ values }) => workflowService.preview(text(values, "path")),
  },

  {
    workspace: "Cache",
    id: "cache.inspect",
    title: "Inspect Cache",
    command: "ghg cache inspect <key>",
    description: "Inspect GitHub Actions cache metadata.",

    inputs: [
      { key: "key", label: "Cache key", type: "string", required: true },
      repoInput,
    ],

    run: ({ values }) =>
      cacheService.inspect(requiredText(values, "key"), text(values, "repo")),
  },

  {
    mutates: true,
    workspace: "Cache",
    id: "cache.download",
    command: "ghg cache download <key>",
    title: "Download Cache Debug Bundle",
    description: "Download cache-related debug artifacts.",

    inputs: [
      { key: "key", label: "Cache key", type: "string", required: true },
      repoInput,
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: ({ values }) =>
      cacheService.download(requiredText(values, "key"), {
        repo: text(values, "repo"),
        outputDir: text(values, "outputDir"),
      }),
  },

  {
    mutates: true,
    id: "run.debug",
    workspace: "Run",
    title: "Debug Workflow Run",
    command: "ghg run debug <run-id>",
    description: "Fetch logs, artifacts, and annotations for a run.",

    inputs: [
      { key: "runId", label: "Run ID", type: "number", required: true },
      repoInput,
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: ({ values }) =>
      runService.debugRun(numberValue(values, "runId"), {
        repo: text(values, "repo"),
        outputDir: text(values, "outputDir"),
      }),
  },

  {
    mutates: true,
    id: "profile.add",
    title: "Add Profile",
    workspace: "Profile",
    command: "ghg profile add <name>",
    description: "Add or update a profile.",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },
      repoInput,
      {
        key: "token",
        secret: true,
        label: "Token",
        type: "string",
        required: true,
      },
    ],

    run: ({ values }) =>
      profileService.add(requiredText(values, "name"), {
        repo: text(values, "repo"),
        token: requiredText(values, "token"),
      }),
  },

  {
    id: "profile.list",
    workspace: "Profile",
    title: "List Profiles",
    command: "ghg profile list",
    description: "List configured profiles.",
    run: () => profileService.list(),
  },

  {
    mutates: true,
    id: "profile.switch",
    workspace: "Profile",
    title: "Switch Profile",
    command: "ghg profile switch <name>",
    description: "Switch the active profile.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],
    run: ({ values }) => profileService.switch(requiredText(values, "name")),
  },

  {
    mutates: true,
    id: "profile.detect",
    workspace: "Profile",
    title: "Detect Profile",
    command: "ghg profile detect",
    description: "Detect profile for current repository.",
    run: () => profileService.detect(),
  },

  {
    mutates: true,
    id: "config.set",
    title: "Set Config",
    workspace: "Config",
    description: "Set a config value.",
    command: "ghg config set <key> <value>",

    inputs: [
      { key: "key", label: "Key", type: "string", required: true },
      {
        key: "value",
        secret: true,
        label: "Value",
        type: "string",
        required: true,
      },
    ],

    run: ({ values }) =>
      configService.set(
        requiredText(values, "key"),
        requiredText(values, "value"),
      ),
  },

  {
    id: "config.get",
    title: "Get Config",
    workspace: "Config",
    command: "ghg config get <key>",
    description: "Read a config value.",
    inputs: [{ key: "key", label: "Key", type: "string", required: true }],
    run: ({ values }) => configService.get(requiredText(values, "key")),
  },

  {
    mutates: true,
    id: "config.unset",
    workspace: "Config",
    title: "Unset Config",
    command: "ghg config unset <key>",
    description: "Remove a config value.",
    inputs: [{ key: "key", label: "Key", type: "string", required: true }],
    run: ({ values }) => configService.unset(requiredText(values, "key")),
  },

  {
    id: "ping",
    title: "Ping",
    command: "ghg ping",
    workspace: "Utility",
    description: "Check if the CLI is working.",
    run: () => labelsService.ping(),
  },

  {
    id: "version",
    title: "Version",
    workspace: "Utility",
    command: "ghg version",
    description: "Show the current version.",
    run: () => ({ success: true, version: __VERSION__ }),
  },

  {
    id: "proxy",
    mutates: true,
    title: "Proxy to gh",
    workspace: "Utility",
    command: "ghg proxy <args>",
    description: "Pass arguments through to the GitHub CLI.",
    inputs: [{ key: "args", label: "gh args", type: "string", required: true }],

    run: async ({ values }) => {
      const result = await proxy.runProxyCapture(
        requiredText(values, "args").split(/\s+/).filter(Boolean),
      );

      return (
        result.stdout || result.stderr || `Exited with code ${result.exitCode}.`
      );
    },
  },

  {
    id: "release.changelog",
    workspace: "Release",
    title: "Release Changelog",
    command: "ghg release changelog",
    description: "Generate changelog from conventional commits.",

    inputs: [
      { key: "since", label: "Since tag", type: "string" },
      { key: "to", label: "To ref", type: "string", defaultValue: "HEAD" },
    ],

    run: ({ values }) =>
      releaseService.changelog({
        to: text(values, "to") ?? undefined,
        since: text(values, "since") ?? undefined,
      }),
  },

  {
    mutates: true,
    id: "release.bump",
    workspace: "Release",
    title: "Bump Version",
    command: "ghg release bump",
    description: "Auto-detect or specify the next semver bump.",

    inputs: [
      {
        key: "level",
        label: "Level",
        type: "string",
        placeholder: "major, minor, patch",
      },

      { key: "create", label: "Create tag", type: "boolean" },
      { key: "push", label: "Push tag", type: "boolean" },
    ],

    run: ({ values }) =>
      releaseService.bump({
        level: text(values, "level") as BumpLevel | undefined,
        create: booleanValue(values, "create"),
        push: booleanValue(values, "push"),
      }),
  },

  {
    title: "Verify Tag",
    id: "release.verify",
    workspace: "Release",
    command: "ghg release verify <tag>",
    description: "Verify local tag/commit GPG signatures and release assets.",
    inputs: [{ key: "tag", label: "Tag", type: "string", required: true }],
    run: ({ values }) => releaseService.verify(requiredText(values, "tag"), {}),
  },

  {
    id: "release.notes",
    workspace: "Release",
    title: "Release Notes",
    command: "ghg release notes",
    description: "Generate release notes from a template.",

    inputs: [
      { key: "template", label: "Template file", type: "string" },
      { key: "since", label: "Since tag", type: "string" },
      { key: "out", label: "Output file", type: "string" },
    ],

    run: ({ values }) =>
      releaseService.notes({
        out: text(values, "out") ?? undefined,
        since: text(values, "since") ?? undefined,
        templateFile: text(values, "template") ?? undefined,
      }),
  },

  {
    mutates: true,
    id: "release.draft",
    workspace: "Release",
    title: "Draft Release",
    command: "ghg release draft",
    description: "Create a draft release on GitHub.",

    inputs: [
      {
        key: "level",
        label: "Level",
        type: "string",
        defaultValue: "patch",
        placeholder: "major, minor, patch",
      },

      { key: "title", label: "Title", type: "string" },
      {
        key: "notes",
        label: "Notes",
        type: "string",
        defaultValue: "generated",
      },
    ],

    run: ({ values }) =>
      releaseService.draft({
        level: (text(values, "level") as BumpLevel) ?? "patch",

        title: text(values, "title") ?? undefined,
        notes: text(values, "notes") ?? undefined,
      }),
  },
];

const workspaces = Array.from(new Set(operations.map((op) => op.workspace)));

export default operations;
export { workspaces };
