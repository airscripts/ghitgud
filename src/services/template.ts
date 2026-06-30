import api from "@/api/templates";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";

interface TemplateEntry {
  name: string;
  path: string;
  type: string;
}

interface TemplateContent {
  name: string;
  path: string;
  content: string | null;
  about: string | null;
  title: string | null;
  labels: string[];
  assignees: string[];
}

const YAML_FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

const parseFrontmatter = (raw: string): Record<string, string> => {
  const match = raw.match(YAML_FRONTMATTER_REGEX);
  if (!match) return {};
  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      frontmatter[key] = value;
    }
  }
  return frontmatter;
};

const list = async (options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading templates for ${repo}.`);

  const templates: TemplateContent[] = [];

  try {
    const response = await api.list(repo);
    const entries = (await response.json()) as TemplateEntry[];
    const issueTemplates = entries.filter(
      (e) =>
        e.type === "file" &&
        (e.name.endsWith(".md") ||
          e.name.endsWith(".yaml") ||
          e.name.endsWith(".yml")),
    );

    for (const entry of issueTemplates) {
      try {
        const fileResponse = await api.get(repo, entry.path);
        const fileData = (await fileResponse.json()) as {
          content?: string;
          name?: string;
          path?: string;
        };
        const decoded = fileData.content
          ? Buffer.from(fileData.content, "base64").toString("utf-8")
          : "";
        const fm = parseFrontmatter(decoded);
        templates.push({
          name: fm.name ?? entry.name,
          path: entry.path,
          content: decoded,
          about: fm.about ?? null,
          title: fm.title ?? null,
          labels: fm.labels ? fm.labels.split(",").map((l) => l.trim()) : [],
          assignees: fm.assignees
            ? fm.assignees.split(",").map((a) => a.trim())
            : [],
        });
      } catch {
        templates.push({
          name: entry.name,
          path: entry.path,
          content: null,
          about: null,
          title: null,
          labels: [],
          assignees: [],
        });
      }
    }
  } catch {
    // No issue templates directory.
  }

  try {
    const prResponse = await api.listPrTemplates(repo);
    const prEntries = (await prResponse.json()) as TemplateEntry[];
    const prTemplate = prEntries.find(
      (e) =>
        e.type === "file" &&
        (e.name.toLowerCase() === "pull_request_template.md" ||
          e.name.toLowerCase() === "pull_request_template"),
    );
    if (prTemplate) {
      try {
        const fileResponse = await api.get(repo, prTemplate.path);
        const fileData = (await fileResponse.json()) as { content?: string };
        const decoded = fileData.content
          ? Buffer.from(fileData.content, "base64").toString("utf-8")
          : "";
        templates.push({
          name: "Pull Request Template",
          path: prTemplate.path,
          content: decoded,
          about: null,
          title: null,
          labels: [],
          assignees: [],
        });
      } catch {
        templates.push({
          name: "Pull Request Template",
          path: prTemplate.path,
          content: null,
          about: null,
          title: null,
          labels: [],
          assignees: [],
        });
      }
    }
  } catch {
    // No PR template.
  }

  output.renderTable(
    templates.map((t) => ({
      name: t.name,
      path: t.path,
      about: t.about ?? "-",
    })),
    { emptyMessage: "No templates found." },
  );
  logger.success(`Loaded ${templates.length} template(s).`);
  return { success: true, templates };
};

const show = async (name: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading template "${name}" from ${repo}.`);

  let templatePath = name;
  if (!name.startsWith(".github/")) {
    templatePath = `.github/ISSUE_TEMPLATE/${name}`;
  }

  const response = await api.get(repo, templatePath);
  const fileData = (await response.json()) as {
    content?: string;
    name?: string;
    path?: string;
  };
  const decoded = fileData.content
    ? Buffer.from(fileData.content, "base64").toString("utf-8")
    : "";

  const fm = parseFrontmatter(decoded);

  output.renderKeyValues([
    ["Name", fm.name ?? fileData.name ?? name],
    ["About", fm.about ?? "-"],
    ["Title", fm.title ?? "-"],
    ["Labels", fm.labels ?? "-"],
    ["Path", fileData.path ?? templatePath],
  ]);

  logger.success(`Loaded template "${name}".`);
  return { success: true, content: decoded };
};

export default { list, show };
