import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import gpgKeyService from "@/services/gpg-key";
import { commandGroup } from "@/operations/groups";

const register = (program: Command) => {
  const gpgKey = commandGroup(
    program,
    "identity",
    "Manage provider account identity keys.",
  )
    .command("gpg")
    .description("Manage GPG keys.");

  gpgKey
    .command("list")
    .description("List your GPG keys.")
    .action(async () => {
      await command.run(() => gpgKeyService.list());
    });

  gpgKey
    .command("add")
    .description("Add a GPG key.")
    .option("--key <armored-key>", "Armored GPG public key string")
    .option("--file <path>", "Path to armored GPG public key file")
    .action(async (options) => {
      await command.run(() =>
        gpgKeyService.add({
          key: options.key,
          file: options.file,
        }),
      );
    });

  gpgKey
    .command("delete <id>")
    .description("Delete a GPG key.")
    .option("--yes", "Confirm deletion")
    .action(async (id: string, options: { yes?: boolean }) => {
      await command.run(() =>
        gpgKeyService.delete(parse.parsePositiveInt(id, "key id"), {
          yes: options.yes,
        }),
      );
    });
};

export default { register };
