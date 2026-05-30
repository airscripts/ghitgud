import path from "path";
import process from "process";

import git from "@/core/git";
import config from "@/core/config";
import { truncateMiddle } from "./layout";

interface StatusItem {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}

interface StatusContext {
  workspace: string;
  operationCount: number;
}

interface StatusDependencies {
  cwd?: string;
  repo?: string | null;
  token?: string | null;
  branch?: string | null;
  profiles?: Array<{ name: string; active: boolean }>;
}

const getActiveProfile = (
  profiles: Array<{ name: string; active: boolean }>,
) => {
  return profiles.find((profile) => profile.active)?.name ?? "default";
};

const formatCwd = (cwd: string, width = 30) => {
  const home = process.env.HOME;

  const normalized =
    home && cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd;

  return truncateMiddle(normalized || path.sep, width);
};

const getBranch = () => {
  try {
    if (!git.isInsideRepo()) return null;
    return git.getCurrentBranch();
  } catch {
    return null;
  }
};

const resolveStatusDependencies = (): StatusDependencies => ({
  cwd: process.cwd(),
  repo: safeRead(() => config.getRepoOptional()),
  token: safeRead(() => config.getTokenOptional()),
  profiles: safeRead(() => config.listProfiles()) ?? [],
  branch: getBranch(),
});

const safeRead = <T>(read: () => T): T | null => {
  try {
    return read();
  } catch {
    return null;
  }
};

const buildStatusItems = (
  context: StatusContext,
  dependencies: StatusDependencies = resolveStatusDependencies(),
): StatusItem[] => {
  const tokenSet = !!dependencies.token;
  const profiles = dependencies.profiles ?? [];

  return [
    {
      label: "token",
      value: tokenSet ? "set" : "missing",
      tone: tokenSet ? "success" : "danger",
    },

    {
      label: "cwd",
      value: formatCwd(dependencies.cwd ?? process.cwd()),
    },

    {
      label: "profile",
      value: getActiveProfile(profiles),
    },

    {
      label: "repo",
      value: dependencies.repo ?? "not set",
      tone: dependencies.repo ? "default" : "warning",
    },

    ...(dependencies.branch
      ? [
          {
            label: "branch",
            value: dependencies.branch,
          },
        ]
      : []),

    {
      label: "workspace",
      value: context.workspace,
    },

    {
      label: "commands",
      value: String(context.operationCount),
    },
  ];
};

export { buildStatusItems, formatCwd, getActiveProfile };
export type { StatusDependencies, StatusItem };
