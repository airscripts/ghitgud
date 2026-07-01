import api from "@/api/gpg-keys";
import output from "@/core/output";
import logger from "@/core/logger";
import { GitfleetError } from "@/core/errors";
import fs from "fs";

interface GpgKeyEntry {
  id: number;
  name: string;
  key_id: string;
  created_at: string;
  expires_at: string | null;
}

const list = async () => {
  logger.start("Loading GPG keys.");
  const response = await api.list();
  const keys = (await response.json()) as GpgKeyEntry[];
  output.renderTable(
    keys.map((key) => ({
      id: key.id,
      name: key.name,
      key_id: key.key_id,
      created: key.created_at ?? "-",
      expires: key.expires_at ?? "-",
    })),
    { emptyMessage: "No GPG keys found." },
  );
  logger.success(`Loaded ${keys.length} key(s).`);
  return { success: true, keys };
};

const add = async (options: { key?: string; file?: string }) => {
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
  logger.start("Adding GPG key.");
  const response = await api.add({ armored_public_key: keyValue });
  const keyData = (await response.json()) as GpgKeyEntry;
  output.renderKeyValues([
    ["ID", String(keyData.id)],
    ["Name", keyData.name],
    ["Key ID", keyData.key_id],
    ["Created", keyData.created_at ?? "-"],
  ]);
  logger.success(`Added GPG key ${keyData.key_id}.`);
  return { success: true, key: keyData };
};

const deleteKey = async (id: number, options: { yes?: boolean } = {}) => {
  if (!options.yes) {
    throw new GitfleetError("GPG key deletion requires --yes.");
  }
  logger.start(`Deleting GPG key ${id}.`);
  await api.delete(id);
  logger.success(`Deleted GPG key ${id}.`);
  return { success: true };
};

export default { list, add, delete: deleteKey };
