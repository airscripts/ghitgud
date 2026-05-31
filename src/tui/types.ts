type TuiWorkspace =
  | "Dashboard"
  | "Notifications"
  | "PRs"
  | "Review"
  | "Repositories"
  | "Labels"
  | "Insights"
  | "Workflow"
  | "Cache"
  | "Run"
  | "Profile"
  | "Config"
  | "Utility";

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

export type {
  TuiInput,
  TuiOperation,
  TuiRunResult,
  TuiWorkspace,
  TuiInputValues,
  TuiOperationContext,
};
