import path from "path";
import fs from "fs/promises";

import output from "@/core/output";
import spinner from "@/core/spinner";
import wikiGit from "@/core/wiki-git";
import { GhitgudError } from "@/core/errors";
import type { WikiPage, WikiPageContent } from "@/types";

const INVALID_TITLE = /[\\/:*?"<>|]/;

function validateTitle(page: string): string {
  const title = page.trim();
  if (!title) throw new GhitgudError("Wiki page title is required.");

  if (INVALID_TITLE.test(title)) {
    throw new GhitgudError(
      `Invalid wiki page title "${page}". Avoid \\ / : * ? " < > |.`,
    );
  }

  return title.replaceAll(" ", "-");
}

async function sourceFile(
  file: string,
): Promise<{ content: Buffer; extension: string }> {
  let stats: fs.FileHandle;

  try {
    stats = await fs.open(file, "r");
  } catch {
    throw new GhitgudError(`Wiki source file not found: ${file}.`);
  }

  try {
    const stat = await stats.stat();
    if (!stat.isFile()) {
      throw new GhitgudError(`Wiki source path is not a file: ${file}.`);
    }

    const content = await stats.readFile();
    return { content, extension: path.extname(file) || ".md" };
  } catch (error) {
    if (error instanceof GhitgudError) throw error;
    throw new GhitgudError(`Wiki source file is not readable: ${file}.`);
  } finally {
    await stats.close();
  }
}

async function walk(directory: string, root = directory): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await walk(absolute, root)));
    } else {
      results.push(path.relative(root, absolute));
    }
  }

  return results;
}

function toPage(relativePath: string): WikiPage {
  const filename = path.basename(relativePath);
  const extension = path.extname(filename);
  const basename = extension ? filename.slice(0, -extension.length) : filename;

  return {
    filename,
    path: relativePath,
    title: basename.replaceAll("-", " "),
    format: extension ? extension.slice(1) : "plain",
  };
}

async function pagesIn(directory: string): Promise<WikiPage[]> {
  const files = await walk(directory);
  return files
    .map(toPage)
    .sort((left, right) => left.title.localeCompare(right.title));
}

async function resolvePage(
  directory: string,
  requested: string,
): Promise<WikiPage | null> {
  const normalized = validateTitle(requested);
  const extension = path.extname(normalized);
  const pages = await pagesIn(directory);

  const matches = pages.filter((page) => {
    if (extension) return page.filename === normalized;

    return (
      page.filename.slice(0, -path.extname(page.filename).length) === normalized
    );
  });

  if (matches.length > 1) {
    throw new GhitgudError(
      `Wiki page "${requested}" is ambiguous. Include its file extension.`,
    );
  }

  return matches[0] ?? null;
}

function wikiError(error: unknown): never {
  if (error instanceof GhitgudError) throw error;

  const message = error instanceof Error ? error.message : String(error);
  if (/repository not found|not appear to be a git repository/i.test(message)) {
    throw new GhitgudError(
      "The wiki does not exist or has not been initialized for this repository.",
    );
  }

  if (
    /authentication failed|could not read Username|403|permission denied/i.test(
      message,
    )
  ) {
    throw new GhitgudError(
      "Wiki authentication failed. Check the token and repository permissions.",
    );
  }

  if (/nothing to commit/i.test(message)) {
    throw new GhitgudError("The wiki page content is unchanged.");
  }

  throw new GhitgudError("Wiki Git operation failed.");
}

const list = async (
  repo: string,
): Promise<{ success: boolean; pages: WikiPage[] }> => {
  try {
    const result = await spinner.withSpinner(
      `Loading wiki pages for ${repo}.`,
      async () => {
        const pages = await wikiGit.withClone(repo, async (directory) => {
          return await pagesIn(directory);
        });

        output.renderTable(
          pages.map((page) => ({
            title: page.title,
            filename: page.filename,
            format: page.format,
            path: page.path,
          })),
          { emptyMessage: "No wiki pages found." },
        );

        return pages;
      },
      `Loaded wiki pages for ${repo}.`,
    );
    return { success: true, pages: result };
  } catch (error) {
    return wikiError(error);
  }
};

const view = async (
  repo: string,
  page: string,
): Promise<{ success: boolean; page: WikiPageContent }> => {
  try {
    const result = await spinner.withSpinner(
      `Loading wiki page ${page}.`,
      async () => {
        return await wikiGit.withClone(repo, async (directory) => {
          const resolved = await resolvePage(directory, page);

          if (!resolved)
            throw new GhitgudError(`Wiki page not found: ${page}.`);

          const content = await fs.readFile(
            path.join(directory, resolved.path),
            "utf8",
          );

          return { ...resolved, content };
        });
      },
      `Loaded wiki page ${page}.`,
    );
    output.log(result.content);
    return { success: true, page: result };
  } catch (error) {
    return wikiError(error);
  }
};

const edit = async (
  repo: string,
  page: string,
  file: string,
): Promise<{ success: boolean; page: WikiPage }> => {
  const source = await sourceFile(file);

  try {
    const result = await spinner.withSpinner(
      `Updating wiki page ${page}.`,
      async () => {
        return await wikiGit.withClone(repo, async (directory) => {
          const resolved = await resolvePage(directory, page);

          if (!resolved)
            throw new GhitgudError(`Wiki page not found: ${page}.`);

          await fs.writeFile(
            path.join(directory, resolved.path),
            source.content,
          );

          await wikiGit.commitAndPush(
            directory,
            `docs: update wiki page ${resolved.title}`,
          );

          return resolved;
        });
      },
      `Updated wiki page ${page}.`,
    );
    return { success: true, page: result };
  } catch (error) {
    return wikiError(error);
  }
};

const create = async (
  repo: string,
  page: string,
  file: string,
): Promise<{ success: boolean; page: WikiPage }> => {
  const normalized = validateTitle(page);
  const source = await sourceFile(file);

  try {
    const result = await spinner.withSpinner(
      `Creating wiki page ${page}.`,
      async () => {
        return await wikiGit.withClone(repo, async (directory) => {
          if (await resolvePage(directory, page)) {
            throw new GhitgudError(`Wiki page already exists: ${page}.`);
          }

          const filename = path.extname(normalized)
            ? normalized
            : `${normalized}${source.extension}`;

          const target = path.join(directory, filename);
          await fs.writeFile(target, source.content);
          const created = toPage(filename);

          await wikiGit.commitAndPush(
            directory,
            `docs: create wiki page ${created.title}`,
          );

          return created;
        });
      },
      `Created wiki page ${page}.`,
    );
    return { success: true, page: result };
  } catch (error) {
    return wikiError(error);
  }
};

const deletePage = async (
  repo: string,
  page: string,
): Promise<{ success: boolean; page: WikiPage }> => {
  validateTitle(page);

  try {
    const result = await spinner.withSpinner(
      `Deleting wiki page ${page}.`,
      async () => {
        return await wikiGit.withClone(repo, async (directory) => {
          const resolved = await resolvePage(directory, page);

          if (!resolved) {
            throw new GhitgudError(`Wiki page not found: ${page}.`);
          }

          await fs.rm(path.join(directory, resolved.path));
          await wikiGit.commitAndPush(
            directory,
            `docs: delete wiki page ${resolved.title}`,
          );

          return resolved;
        });
      },
      `Deleted wiki page ${page}.`,
    );
    return { success: true, page: result };
  } catch (error) {
    return wikiError(error);
  }
};

export default { create, edit, delete: deletePage, list, view };
