type Mode =
  | "dashboard"
  | "normal"
  | "insert"
  | "palette"
  | "confirm"
  | "visual";

type TuiWorkspace =
  | "Dashboard"
  | "Notifications"
  | "PRs"
  | "Review"
  | "Issues"
  | "Projects"
  | "Milestones"
  | "Repositories"
  | "Labels"
  | "Insights"
  | "Workflow"
  | "Cache"
  | "Run"
  | "Auth"
  | "Config"
  | "Utility"
  | "Release"
  | "Discussions"
  | "Variables"
  | "Secrets"
  | "Environments"
  | "Security"
  | "Organization"
  | "Team"
  | "Repository Access"
  | "Pages"
  | "Wiki"
  | "Search";

type TuiInputType = "string" | "number" | "boolean";

interface TuiInput {
  key: string;
  label: string;
  secret?: boolean;
  type: TuiInputType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

type TuiInputValues = Record<string, string | number | boolean>;

interface TuiOperationContext {
  values: TuiInputValues;
}

interface TuiOperation {
  id: string;
  title: string;
  command: string;
  mutates?: boolean;
  description: string;
  inputs?: TuiInput[];
  workspace: TuiWorkspace;
  dryRunDefault?: boolean;
  run: (context: TuiOperationContext) => Promise<unknown> | unknown;
}

interface TuiRunResult {
  ok: boolean;
  title: string;
  output: string;
}

interface DashboardData {
  version: string;
  tokenSet: boolean;
  repo: string | null;
  branch: string | null;
  profile: string | null;
}

type MouseEvent =
  | {
      x: number;
      y: number;
      type: "press" | "release" | "drag";
      button: "left" | "middle" | "right" | "none";
    }
  | { type: "scroll"; direction: "up" | "down"; x: number; y: number };

export type {
  Mode,
  TuiInput,
  MouseEvent,
  TuiOperation,
  TuiRunResult,
  DashboardData,
  TuiWorkspace,
  TuiInputValues,
  TuiOperationContext,
};
