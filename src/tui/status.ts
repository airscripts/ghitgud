import path from "path";
import process from "process";

import git from "@/core/git";
import config from "@/core/config";
import { truncateMiddle } from "./layout";

interface StatusItem {
  label: string;
  value: string;
  tone?: string;
}

interface StatusContext {
  mode: string;
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
  return profiles.find((profile) => profile.active)?.name ?? null;
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
  const repoSet = !!dependencies.repo;
  const profile = getActiveProfile(dependencies.profiles ?? []);
  const folder = path.basename(dependencies.cwd ?? process.cwd());

  return [
    {
      label: "token",
      value: tokenSet ? "set" : "none",
      tone: tokenSet ? "success" : "danger",
    },

    {
      label: "repo",
      value: repoSet ? "set" : "none",
      tone: repoSet ? "success" : "danger",
    },

    {
      label: "profile",
      value: profile ?? "none",
      tone: profile ? undefined : "warning",
    },

    {
      label: "cwd",
      value: truncateMiddle(folder, 18),
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
      label: "mode",
      tone: context.mode,
      value: context.mode,
    },
  ];
};

export { buildStatusItems, getActiveProfile };
export type { StatusDependencies, StatusItem };
