import fs from "fs";
import path from "path";
import os from "os";
import { GitfleetError } from "@/core/errors";

import type { RepositoryRef } from "@/domain/provider";

interface Workspace {
  name: string;
  repositories: RepositoryRef[];
}

const WORKSPACES_DIR = path.join(os.homedir(), ".config", "gitfleet");
const WORKSPACES_FILE = path.join(WORKSPACES_DIR, "workspaces.json");

function ensureDir(): void {
  if (!fs.existsSync(WORKSPACES_DIR)) {
    fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
  }
}

const loadAll = (): Workspace[] => {
  ensureDir();
  if (!fs.existsSync(WORKSPACES_FILE)) return [];
  const raw = fs.readFileSync(WORKSPACES_FILE, "utf8");
  return JSON.parse(raw) as Workspace[];
};

const saveAll = (workspaces: Workspace[]): void => {
  ensureDir();
  fs.writeFileSync(
    WORKSPACES_FILE,
    JSON.stringify(workspaces, null, 2),
    "utf8",
  );
};

function parseRepository(value: string): RepositoryRef {
  const qualified = value.match(/^([a-z][a-z0-9-]*)@([^:]+):(.+)$/i);
  const provider = qualified?.[1] ?? "github";
  const host = qualified?.[2] ?? "github.com";
  const path = qualified?.[3] ?? value;
  if (provider !== "github") {
    throw new GitfleetError(`Unsupported repository provider "${provider}".`);
  }
  const segments = path.split("/").filter(Boolean);
  const name = segments.pop();
  const namespace = segments.join("/");
  if (!name || !namespace) {
    throw new GitfleetError(
      `Invalid repository "${value}". Expected namespace/repository.`,
    );
  }
  return {
    provider,
    host,
    namespace,
    name,
  };
}

const define = (name: string, repos: string[]): Workspace => {
  const workspaces = loadAll();
  const existing = workspaces.findIndex((w) => w.name === name);
  const workspace: Workspace = {
    name,
    repositories: repos.map(parseRepository),
  };
  if (existing >= 0) {
    workspaces[existing] = workspace;
  } else {
    workspaces.push(workspace);
  }
  saveAll(workspaces);
  return workspace;
};

const get = (name: string): Workspace => {
  const workspaces = loadAll();
  const workspace = workspaces.find((w) => w.name === name);
  if (!workspace) throw new GitfleetError(`Workspace "${name}" not found.`);
  return workspace;
};

const list = (): Workspace[] => loadAll();

const remove = (name: string): void => {
  const workspaces = loadAll();
  const filtered = workspaces.filter((w) => w.name !== name);
  if (filtered.length === workspaces.length) {
    throw new GitfleetError(`Workspace "${name}" not found.`);
  }
  saveAll(filtered);
};

export default { define, get, list, remove };
export type { Workspace };
