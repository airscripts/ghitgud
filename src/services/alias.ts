import fs from "fs";
import process from "process";
import path from "path";

import output from "@/core/output";
import logger from "@/core/logger";
import { GitfleetError } from "@/core/errors";
import io from "@/core/io";

import {
  GITFLEET_FOLDER,
  ERROR_ALIAS_NOT_FOUND,
  ERROR_ALIAS_EXISTS,
  ERROR_ALIAS_NAME_REQUIRED,
  ERROR_ALIAS_EXPANSION_REQUIRED,
  ALIAS_CONFIG_KEY,
} from "@/core/constants";
import type { AliasEntry } from "@/types";

function getAliasesPath(): string {
  return path.join(GITFLEET_FOLDER, `${ALIAS_CONFIG_KEY}.json`);
}
function readAliases(): Record<string, string> {
  const aliasesPath = getAliasesPath();
  if (!io.fileExists(aliasesPath)) {
    return {};
  }

  try {
    return io.readJsonFile<Record<string, string>>(aliasesPath);
  } catch {
    return {};
  }
}

function writeAliases(aliases: Record<string, string>): void {
  io.ensureDir(GITFLEET_FOLDER);
  io.writeJsonFile(getAliasesPath(), aliases);
}

const set = (name: string, expansion: string, force = false) => {
  if (!name) {
    throw new GitfleetError(ERROR_ALIAS_NAME_REQUIRED);
  }

  if (!expansion) {
    throw new GitfleetError(ERROR_ALIAS_EXPANSION_REQUIRED);
  }

  const aliases = readAliases();

  if (aliases[name] && !force) {
    throw new GitfleetError(ERROR_ALIAS_EXISTS);
  }

  aliases[name] = expansion;
  writeAliases(aliases);

  logger.start(`Setting alias "${name}".`);
  logger.success(`Alias "${name}" set to "${expansion}".`);
  return { success: true, name, expansion };
};

const list = () => {
  const aliases = readAliases();
  const entries: AliasEntry[] = Object.entries(aliases).map(
    ([name, expansion]) => ({ name, expansion }),
  );

  if (entries.length === 0) {
    logger.info("No aliases configured.");
    return { success: true, aliases: [] };
  }

  output.renderTable(
    entries.map((entry) => ({
      Alias: entry.name,
      Expansion: entry.expansion,
    })),
  );

  return { success: true, aliases: entries };
};

const deleteAlias = (name: string) => {
  if (!name) {
    throw new GitfleetError(ERROR_ALIAS_NAME_REQUIRED);
  }

  const aliases = readAliases();

  if (!aliases[name]) {
    throw new GitfleetError(ERROR_ALIAS_NOT_FOUND);
  }

  delete aliases[name];
  writeAliases(aliases);

  logger.start(`Deleting alias "${name}".`);
  logger.success(`Alias "${name}" deleted.`);
  return { success: true, name };
};

const importAliases = (filePath?: string) => {
  let content: string;

  if (filePath) {
    content = fs.readFileSync(filePath, "utf8");
  } else {
    content = process.stdin.read() as string;
    if (!content) {
      throw new GitfleetError(
        "No input provided. Pass a file path or pipe data to stdin.",
      );
    }
  }

  const aliases = readAliases();
  let imported = 0;

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const line of lines) {
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim();
    const expansion = line.slice(separatorIndex + 1).trim();

    if (name && expansion) {
      aliases[name] = expansion;
      imported++;
    }
  }

  writeAliases(aliases);

  logger.start("Importing aliases.");
  logger.success(`Imported ${imported} alias${imported === 1 ? "" : "es"}.`);
  return { success: true, imported };
};

const resolve = (args: string[]): string[] | null => {
  if (args.length === 0) return null;

  const aliases = readAliases();
  const firstArg = args[0];
  const expansion = aliases[firstArg];

  if (!expansion) return null;

  return [...expansion.split(" "), ...args.slice(1)];
};

export default { set, list, deleteAlias, importAliases, resolve };
