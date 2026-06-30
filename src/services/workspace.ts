import workspaceConfig from "@/core/workspace";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import { execSync } from "child_process";

const define = (name: string, repos: string[]) => {
  if (!name) throw new GhitgudError("Workspace name is required.");
  if (!repos.length)
    throw new GhitgudError("At least one repository is required.");
  const workspace = workspaceConfig.define(name, repos);
  logger.success(
    `Defined workspace "${name}" with ${repos.length} repositor(ies).`,
  );
  return { success: true, workspace };
};

const list = () => {
  const workspaces = workspaceConfig.list();
  if (!workspaces.length) {
    output.renderTable([], { emptyMessage: "No workspaces defined." });
    return { success: true, workspaces };
  }
  output.renderTable(
    workspaces.map((w) => ({
      name: w.name,
      repos: w.repos.join(", "),
      count: w.repos.length,
    })),
    { emptyMessage: "No workspaces defined." },
  );
  logger.success(`Loaded ${workspaces.length} workspace(s).`);
  return { success: true, workspaces };
};

const run = async (name: string, command: string) => {
  const workspace = workspaceConfig.get(name);
  logger.start(
    `Running "${command}" across ${workspace.repos.length} repositor(ies).`,
  );
  const results: Array<{ repo: string; success: boolean; output: string }> = [];
  for (const repo of workspace.repos) {
    try {
      const result = execSync(`ghg ${command} --repo ${repo}`, {
        encoding: "utf8",
        timeout: 60000,
      });
      results.push({ repo, success: true, output: result.trim() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ repo, success: false, output: message.slice(0, 200) });
    }
  }
  output.renderTable(
    results.map((r) => ({
      repo: r.repo,
      status: r.success ? "success" : "failed",
      output: r.output.slice(0, 80),
    })),
    { emptyMessage: "No results." },
  );
  const failed = results.filter((r) => !r.success).length;
  logger.success(
    `Completed: ${results.length - failed} succeeded, ${failed} failed.`,
  );
  return { success: failed === 0, results };
};

export default { define, list, run };
