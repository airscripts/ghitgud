import api from "@/api/ssh-keys";
import output from "@/core/output";
import logger from "@/core/logger";
import { GitfleetError } from "@/core/errors";
import fs from "fs";

interface SshKeyEntry {
  id: number;
  title: string;
  key: string;
  created_at: string;
}

const list = async () => {
  logger.start("Loading SSH keys.");
  const response = await api.list();
  const keys = (await response.json()) as SshKeyEntry[];
  output.renderTable(
    keys.map((key) => ({
      id: key.id,
      title: key.title,
      fingerprint: key.key.split(" ").slice(0, 2).join(" "),
      created: key.created_at ?? "-",
    })),
    { emptyMessage: "No SSH keys found." },
  );
  logger.success(`Loaded ${keys.length} key(s).`);
  return { success: true, keys };
};

const add = async (options: { title: string; key?: string; file?: string }) => {
  let keyValue = options.key;
  if (!keyValue && options.file) {
    if (!fs.existsSync(options.file)) {
      throw new GitfleetError(`File not found: ${options.file}`);
    }
    keyValue = fs.readFileSync(options.file, "utf-8").trim();
  }
  if (!keyValue) {
    throw new GitfleetError("Either --key or --file is required.");
  }
  logger.start(`Adding SSH key "${options.title}".`);
  const response = await api.add({ title: options.title, key: keyValue });
  const keyData = (await response.json()) as SshKeyEntry;
  output.renderKeyValues([
    ["ID", String(keyData.id)],
    ["Title", keyData.title],
    ["Created", keyData.created_at ?? "-"],
  ]);
  logger.success(`Added SSH key "${options.title}".`);
  return { success: true, key: keyData };
};

const deleteKey = async (id: number, options: { yes?: boolean } = {}) => {
  if (!options.yes) {
    throw new GitfleetError("SSH key deletion requires --yes.");
  }
  logger.start(`Deleting SSH key ${id}.`);
  await api.delete(id);
  logger.success(`Deleted SSH key ${id}.`);
  return { success: true };
};

export default { list, add, delete: deleteKey };
