import type { TuiOperation } from "../types";
import sshKeyService from "@/services/ssh-key";
import { text, requiredText, numberValue } from "./shared";

const sshKeyOperations: TuiOperation[] = [
  {
    workspace: "Auth",
    id: "ssh-key.list",
    title: "List SSH Keys",
    command: "gitfleet ssh-key list",
    description: "List your SSH keys.",
    inputs: [],
    run: async () => sshKeyService.list(),
  },
  {
    mutates: true,
    workspace: "Auth",
    id: "ssh-key.add",
    title: "Add SSH Key",
    command: "gitfleet ssh-key add --title <title> --key <key>",
    description: "Add an SSH key.",
    inputs: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "key", label: "Public key", type: "string" },
      { key: "file", label: "Key file path", type: "string" },
    ],
    run: async ({ values }) =>
      sshKeyService.add({
        title: requiredText(values, "title"),
        key: text(values, "key"),
        file: text(values, "file"),
      }),
  },
  {
    mutates: true,
    workspace: "Auth",
    id: "ssh-key.delete",
    title: "Delete SSH Key",
    command: "gitfleet ssh-key delete <id> --yes",
    description: "Delete an SSH key.",
    inputs: [{ key: "id", label: "Key ID", type: "number", required: true }],
    run: async ({ values }) =>
      sshKeyService.delete(numberValue(values, "id"), { yes: true }),
  },
];

export default sshKeyOperations;
