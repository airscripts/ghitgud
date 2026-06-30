import path from "path";
import { execSync } from "child_process";
import { EXTENSIONS_DIR } from "@/core/constants";
import io from "@/core/io";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import type { ExtensionManifest } from "@/types";

const EXTENSION_PREFIX = "ghg-";

const getExtensionDir = (name: string) => path.join(EXTENSIONS_DIR, name);

const getEntryPoint = (extDir: string): string | null => {
  const manifestPath = path.join(extDir, "manifest.json");
  if (io.fileExists(manifestPath)) {
    const manifest = io.readJsonFile<ExtensionManifest>(manifestPath);
    if (manifest.command) {
      const candidate = path.join(extDir, manifest.command);
      if (io.fileExists(candidate)) return candidate;
    }
  }
  const indexPath = path.join(extDir, "index.js");
  if (io.fileExists(indexPath)) return indexPath;
  return null;
};

const readManifest = (extDir: string): ExtensionManifest | null => {
  const manifestPath = path.join(extDir, "manifest.json");
  if (!io.fileExists(manifestPath)) return null;
  return io.readJsonFile<ExtensionManifest>(manifestPath);
};

const list = () => {
  logger.start("Loading extensions.");
  io.ensureDir(EXTENSIONS_DIR);

  const entries = io.readDir(EXTENSIONS_DIR);
  const extensions: Array<ExtensionManifest & { dir: string }> = [];

  for (const entry of entries) {
    const extDir = path.join(EXTENSIONS_DIR, entry);
    if (!io.isDirectory(extDir)) continue;
    const manifest = readManifest(extDir);
    if (manifest) {
      extensions.push({ ...manifest, dir: entry });
    } else {
      extensions.push({
        name: entry,
        description: "-",
        version: "-",
        command: `${EXTENSION_PREFIX}${entry}`,
        dir: entry,
      });
    }
  }

  output.renderTable(
    extensions.map((ext) => ({
      name: ext.name,
      version: ext.version,
      command: ext.command,
      description: ext.description,
    })),
    { emptyMessage: "No extensions installed." },
  );
  logger.success(`Loaded ${extensions.length} extension(s).`);
  return { success: true, extensions };
};

const install = async (repo: string) => {
  io.ensureDir(EXTENSIONS_DIR);
  const name = repo.split("/").pop() ?? repo;
  const extDir = getExtensionDir(name);

  if (io.isDirectory(extDir)) {
    throw new GhitgudError(`Extension "${name}" is already installed.`);
  }

  logger.start(`Installing extension from ${repo}.`);
  try {
    execSync(`git clone --depth 1 ${repo} ${extDir}`, {
      stdio: "pipe",
    });
  } catch {
    throw new GhitgudError(`Failed to clone extension from ${repo}.`);
  }

  const manifest = readManifest(extDir);
  const displayName = manifest?.name ?? name;

  output.renderKeyValues([
    ["Name", displayName],
    ["Version", manifest?.version ?? "unknown"],
    ["Source", repo],
  ]);
  logger.success(`Installed extension "${displayName}".`);
  return { success: true, name: displayName };
};

const remove = (name: string) => {
  const extDir = getExtensionDir(name);
  if (!io.isDirectory(extDir)) {
    throw new GhitgudError(`Extension "${name}" is not installed.`);
  }

  logger.start(`Removing extension "${name}".`);
  io.removeDir(extDir);
  logger.success(`Removed extension "${name}".`);
  return { success: true };
};

const upgrade = (name: string) => {
  const extDir = getExtensionDir(name);
  if (!io.isDirectory(extDir)) {
    throw new GhitgudError(`Extension "${name}" is not installed.`);
  }

  logger.start(`Upgrading extension "${name}".`);
  try {
    execSync("git pull", { cwd: extDir, stdio: "pipe" });
  } catch {
    throw new GhitgudError(`Failed to upgrade extension "${name}".`);
  }

  const manifest = readManifest(extDir);
  logger.success(
    `Upgraded extension "${name}" to ${manifest?.version ?? "latest"}.`,
  );
  return { success: true, version: manifest?.version };
};

const create = (name: string) => {
  io.ensureDir(EXTENSIONS_DIR);
  const extDir = getExtensionDir(name);

  if (io.isDirectory(extDir)) {
    throw new GhitgudError(`Extension "${name}" already exists.`);
  }

  if (!name.startsWith(EXTENSION_PREFIX)) {
    throw new GhitgudError(
      `Extension name must start with "${EXTENSION_PREFIX}".`,
    );
  }

  logger.start(`Creating extension "${name}".`);
  io.ensureDir(extDir);

  const manifest: ExtensionManifest = {
    name,
    description: `A ghg extension: ${name}`,
    version: "0.1.0",
    command: name,
  };

  io.writeJsonFile(path.join(extDir, "manifest.json"), manifest);

  const indexPath = path.join(extDir, "index.js");
  io.writeFile(
    indexPath,
    `#!/usr/bin/env node\nconsole.log("${name} extension is running.");\n`,
  );

  output.renderKeyValues([
    ["Name", manifest.name],
    ["Version", manifest.version],
    ["Path", extDir],
  ]);
  logger.success(`Created extension "${name}".`);
  return { success: true, name, path: extDir };
};

const exec = (name: string, args: string[] = []) => {
  const extDir = getExtensionDir(name);
  if (!io.isDirectory(extDir)) {
    throw new GhitgudError(`Extension "${name}" is not installed.`);
  }

  const entryPoint = getEntryPoint(extDir);
  if (!entryPoint) {
    throw new GhitgudError(
      `Extension "${name}" has no entry point (expected index.js or manifest command).`,
    );
  }

  const commandParts = [entryPoint, ...args];
  const command = commandParts.join(" ");

  logger.start(`Running extension "${name}".`);
  try {
    execSync(`node ${command}`, {
      cwd: extDir,
      stdio: "inherit",
      encoding: "utf-8",
    });
    logger.success(`Extension "${name}" completed.`);
    return { success: true, name };
  } catch {
    throw new GhitgudError(`Extension "${name}" exited with an error.`);
  }
};

export default { list, install, remove, upgrade, create, exec };
