import path from "path";

import pc from "picocolors";

import api from "@/api/skill";
import output from "@/core/output";
import logger from "@/core/logger";
import spinner from "@/core/spinner";
import { GhitgudError } from "@/core/errors";
import io from "@/core/io";

import { SKILLS_DIR } from "@/core/constants";
import type { SkillSummary, SkillSearchResult } from "@/types";

const SKILL_MANIFEST_FILE = "skill.json";

const listInstalled = (): SkillSummary[] => {
  io.ensureDir(SKILLS_DIR);

  if (!io.fileExists(SKILLS_DIR) || !io.isDirectory(SKILLS_DIR)) {
    return [];
  }

  const entries = io.readDir(SKILLS_DIR);
  const skills: SkillSummary[] = [];

  for (const entry of entries) {
    const skillPath = path.join(SKILLS_DIR, entry);
    if (!io.isDirectory(skillPath)) continue;

    const manifestPath = path.join(skillPath, SKILL_MANIFEST_FILE);
    if (!io.fileExists(manifestPath)) continue;

    try {
      const manifest = io.readJsonFile<Record<string, string>>(manifestPath);
      skills.push({
        name: manifest.name ?? entry,
        version: manifest.version ?? "unknown",
        description: manifest.description ?? "",
        repository: manifest.repository ?? "",
        installed: true,
        path: skillPath,
      });
    } catch {
      skills.push({
        name: entry,
        version: "unknown",
        description: "",
        repository: "",
        installed: true,
        path: skillPath,
      });
    }
  }

  return skills;
};

const install = async (
  repository: string,
  skill?: string,
): Promise<{ success: boolean; skill: SkillSummary }> => {
  logger.start(`Installing skill from ${repository}.`);

  const response = await spinner.withSpinner(
    `Fetching skill from ${repository}...`,
    async () => api.getSkill(repository, skill),
    `Fetched skill manifest.`,
  );

  const raw = (await response.json()) as Record<string, unknown>;
  const manifest = (raw.manifest ?? raw) as Record<string, string>;
  const skillName =
    manifest.name ?? skill ?? repository.split("/").pop() ?? "unknown";

  io.ensureDir(SKILLS_DIR);
  const skillDir = path.join(SKILLS_DIR, skillName);
  io.ensureDir(skillDir);

  const manifestContent = {
    name: skillName,
    version: manifest.version ?? "1.0.0",
    description: manifest.description ?? "",
    command: manifest.command ?? skillName,
    repository,
  };

  io.writeJsonFile(path.join(skillDir, SKILL_MANIFEST_FILE), manifestContent);

  logger.success(`Skill "${skillName}" installed from ${repository}.`);

  const result: SkillSummary = {
    name: skillName,
    version: manifestContent.version,
    description: manifestContent.description,
    repository,
    installed: true,
    path: skillDir,
  };

  return { success: true, skill: result };
};

const list = () => {
  const skills = listInstalled();

  if (skills.length === 0) {
    logger.info("No skills installed.");
    return { success: true, skills: [] };
  }

  output.renderTable(
    skills.map((s) => ({
      Name: s.name,
      Version: s.version,
      Description: pc.dim(s.description.slice(0, 50)),
      Repository: s.repository,
    })),
  );

  return { success: true, skills };
};

const preview = async (repository: string, skill?: string) => {
  logger.start(`Previewing skill from ${repository}.`);

  const response = await spinner.withSpinner(
    `Fetching skill details from ${repository}...`,
    async () => api.getSkill(repository, skill),
    `Fetched skill details.`,
  );

  const raw = (await response.json()) as Record<string, unknown>;
  const manifest = (raw.manifest ?? raw) as Record<string, string>;

  output.renderSection(`Skill: ${manifest.name ?? "Unknown"}`);
  output.renderKeyValues([
    ["Name", manifest.name ?? "Unknown"],
    ["Version", manifest.version ?? "Unknown"],
    ["Description", manifest.description ?? "No description"],
    ["Command", manifest.command ?? "Unknown"],
    ["Repository", repository],
  ]);

  return { success: true, preview: manifest };
};

const publish = async (repo: string, manifestPath?: string) => {
  logger.start(`Publishing skill to ${repo}.`);

  let manifest: Record<string, unknown>;

  if (manifestPath) {
    manifest = io.readJsonFile(manifestPath);
  } else {
    const cwd = process.cwd();
    const defaultPath = path.join(cwd, SKILL_MANIFEST_FILE);

    if (!io.fileExists(defaultPath)) {
      throw new GhitgudError(
        `No skill.json found in current directory. Use --file to specify a manifest.`,
      );
    }

    manifest = io.readJsonFile(defaultPath);
  }

  const response = await spinner.withSpinner(
    `Publishing skill to ${repo}...`,
    async () => api.publish(repo, manifest),
    `Skill published.`,
  );

  const result = (await response.json()) as Record<string, unknown>;

  logger.success(`Skill published to ${repo}.`);

  return { success: true, published: result };
};

const search = async (query?: string) => {
  logger.start("Searching skills.");

  if (!query) {
    const installed = listInstalled();
    output.renderTable(
      installed.map((s) => ({
        Name: s.name,
        Version: s.version,
        Description: pc.dim(s.description.slice(0, 50)),
      })),
    );
    return { success: true, results: installed };
  }

  const response = await spinner.withSpinner(
    `Searching skills for "${query}"...`,
    async () => api.search(query),
    `Search complete.`,
  );

  const raw = (await response.json()) as Record<string, unknown>[];
  const results: SkillSearchResult[] = raw.map((r) => ({
    name: (r.name as string) ?? "",
    description: (r.description as string) ?? "",
    repository: (r.repository as string) ?? (r.full_name as string) ?? "",
    url: (r.url as string) ?? (r.html_url as string) ?? "",
  }));

  if (results.length === 0) {
    logger.info("No skills found matching your query.");
    return { success: true, results: [] };
  }

  output.renderTable(
    results.map((r) => ({
      Name: r.name,
      Description: pc.dim(r.description.slice(0, 50)),
      Repository: r.repository,
    })),
  );

  return { success: true, results };
};

const update = async (
  skill?: string,
): Promise<{ success: boolean; updated: string[] }> => {
  const installed = listInstalled();
  const toUpdate = skill
    ? installed.filter((s) => s.name === skill)
    : installed;

  if (toUpdate.length === 0) {
    if (skill) {
      throw new GhitgudError(`Skill "${skill}" is not installed.`);
    }
    logger.info("No skills installed to update.");
    return { success: true, updated: [] };
  }

  const updated: string[] = [];

  for (const s of toUpdate) {
    try {
      await install(s.repository, s.name);
      updated.push(s.name);
    } catch {
      logger.warn(`Failed to update skill "${s.name}".`);
    }
  }

  logger.success(
    `Updated ${updated.length} skill${updated.length === 1 ? "" : "s"}.`,
  );

  return { success: true, updated };
};

export default { install, list, preview, publish, search, update };
