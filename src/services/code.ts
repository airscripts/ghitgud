import api from "@/api/code";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";

interface CodeSearchItem {
  name: string;
  path: string;
  repository: { full_name: string };
  html_url: string;
}

interface CodeSearchResult {
  total_count: number;
  items: CodeSearchItem[];
  incomplete_results: boolean;
}

const search = async (
  query: string,
  options: { repo?: string; language?: string } = {},
) => {
  logger.start(`Searching code for: ${query}`);
  const response = await api.search(query, {
    repo: options.repo,
    language: options.language,
  });
  const data = (await response.json()) as CodeSearchResult;
  output.renderTable(
    data.items.map((item) => ({
      file: item.path,
      repo: item.repository?.full_name ?? "-",
    })),
    { emptyMessage: "No code results found." },
  );
  output.renderSummary("Code Search", [
    ["Total", data.total_count],
    ["Showing", data.items.length],
  ]);
  logger.success(`Found ${data.total_count} result(s).`);
  return { success: true, results: data.items };
};

const definitions = async (symbol: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Searching definitions for: ${symbol}`);
  const response = await api.definitions(symbol, { repo });
  const data = (await response.json()) as CodeSearchResult;
  output.renderTable(
    data.items.map((item) => ({
      file: item.path,
      repo: item.repository?.full_name ?? "-",
    })),
    { emptyMessage: "No definitions found." },
  );
  logger.success(`Found ${data.total_count} definition(s).`);
  return { success: true, results: data.items };
};

const references = async (symbol: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Searching references for: ${symbol}`);
  const response = await api.references(symbol, { repo });
  const data = (await response.json()) as CodeSearchResult;
  output.renderTable(
    data.items.map((item) => ({
      file: item.path,
      repo: item.repository?.full_name ?? "-",
    })),
    { emptyMessage: "No references found." },
  );
  logger.success(`Found ${data.total_count} reference(s).`);
  return { success: true, results: data.items };
};

const file = async (
  path: string,
  options: { repo?: string; ref?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading ${path} from ${repo}.`);
  const response = await api.fileContents(repo, path, options.ref);
  const data = (await response.json()) as Record<string, unknown>;
  if (data.content && typeof data.content === "string") {
    const decoded = Buffer.from(data.content as string, "base64").toString(
      "utf-8",
    );
    output.writeValue(decoded);
  } else {
    output.renderKeyValues([
      ["Path", String(data.path ?? path)],
      ["Type", String(data.type ?? "unknown")],
      ["Size", String(data.size ?? "-")],
    ]);
  }
  logger.success(`Loaded ${path}.`);
  return { success: true, file: data };
};

const blame = async (path: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading blame for ${path} in ${repo}.`);
  const response = await api.blameCommits(repo, path);
  const commits = (await response.json()) as Array<{
    sha: string;
    commit: { author: { date: string }; message: string };
    author: { login: string } | null;
    html_url: string;
  }>;
  const blameEntries = [];
  for (const commit of commits) {
    let prInfo = "-";
    try {
      const prResponse = await api.commitPRs(repo, commit.sha);
      const prs = (await prResponse.json()) as Array<{
        number: number;
        title: string;
      }>;
      if (prs.length > 0) {
        prInfo = prs.map((pr) => `#${pr.number}`).join(", ");
      }
    } catch {
      // No PRs associated.
    }
    blameEntries.push({
      sha: commit.sha.substring(0, 7),
      author: commit.author?.login ?? "-",
      date: commit.commit.author.date,
      message: commit.commit.message.split("\n")[0],
      pr: prInfo,
    });
  }
  output.renderTable(blameEntries, {
    emptyMessage: "No commits found for this path.",
  });
  logger.success(`Loaded ${blameEntries.length} commit(s).`);
  return { success: true, commits: blameEntries };
};

export default { search, definitions, references, file, blame };
