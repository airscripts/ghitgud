import workspaceConfig from "@/core/workspace";
import output from "@/core/output";
import logger from "@/core/logger";
import { GitfleetError } from "@/core/errors";
import { runBulk } from "@/application/bulk";
import { formatRepositoryPath, formatRepositoryRef } from "@/domain/provider";

type WorkspaceExecutor = (args: string[], repo: string) => Promise<void>;

function parseCommand(value: string): string[] {
  const args = value.trim().split(/\s+/).filter(Boolean);
  if (!args.length) throw new GitfleetError("Workspace command is required.");
  if (args.includes("--repo")) {
    throw new GitfleetError(
      "Workspace commands cannot include --repo; Gitfleet supplies it.",
    );
  }
  if (args[0] === "workspace" && args[1] === "run") {
    throw new GitfleetError("Workspace run cannot invoke itself.");
  }
  return args;
}

const define = (name: string, repos: string[]) => {
  if (!name) throw new GitfleetError("Workspace name is required.");
  if (!repos.length)
    throw new GitfleetError("At least one repository is required.");
  const workspace = workspaceConfig.define(name, repos);
  logger.success(
    `Defined workspace "${name}" with ${workspace.repositories.length} repositor(ies).`,
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
      repositories: w.repositories.map(formatRepositoryRef).join(", "),
      count: w.repositories.length,
    })),
    { emptyMessage: "No workspaces defined." },
  );
  logger.success(`Loaded ${workspaces.length} workspace(s).`);
  return { success: true, workspaces };
};

const run = async (
  name: string,
  command: string,
  execute: WorkspaceExecutor,
) => {
  const workspace = workspaceConfig.get(name);
  const args = parseCommand(command);
  logger.start(
    `Running "${command}" across ${workspace.repositories.length} repositor(ies).`,
  );
  const bulkResults = await runBulk(
    workspace.repositories,
    async (repository) => {
      const repo = formatRepositoryPath(repository);
      await execute([...args, "--repo", repo], repo);
    },
    1,
  );
  const results = bulkResults.map((result) => ({
    repo: formatRepositoryRef(result.item),
    success: result.success,
    output: result.error ?? "Completed",
  }));
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
