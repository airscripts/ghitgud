import type { TuiOperation } from "../types";
import gpgKeyService from "@/services/gpg-key";
import { text, numberValue } from "./shared";

const gpgKeyOperations: TuiOperation[] = [
  {
    workspace: "Auth",
    id: "gpg-key.list",
    title: "List GPG Keys",
    command: "gitfleet gpg-key list",
    description: "List your GPG keys.",
    inputs: [],
    run: async () => gpgKeyService.list(),
  },
  {
    mutates: true,
    workspace: "Auth",
    id: "gpg-key.add",
    title: "Add GPG Key",
    command: "gitfleet gpg-key add --key <armored-key>",
    description: "Add a GPG key.",
    inputs: [
      { key: "key", label: "Armored public key", type: "string" },
      { key: "file", label: "Key file path", type: "string" },
    ],
    run: async ({ values }) =>
      gpgKeyService.add({
        key: text(values, "key"),
        file: text(values, "file"),
      }),
  },
  {
    mutates: true,
    workspace: "Auth",
    id: "gpg-key.delete",
    title: "Delete GPG Key",
    command: "gitfleet gpg-key delete <id> --yes",
    description: "Delete a GPG key.",
    inputs: [{ key: "id", label: "Key ID", type: "number", required: true }],
    run: async ({ values }) =>
      gpgKeyService.delete(numberValue(values, "id"), { yes: true }),
  },
];

export default gpgKeyOperations;
