import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import sshKeyService from "@/services/ssh-key";

const register = (program: Command) => {
  const sshKey = program.command("ssh-key").description("Manage SSH keys.");

  sshKey
    .command("list")
    .description("List your SSH keys.")
    .action(async () => {
      await command.run(() => sshKeyService.list());
    });

  sshKey
    .command("add")
    .description("Add an SSH key.")
    .requiredOption("--title <title>", "Key title")
    .option("--key <key>", "Public key string")
    .option("--file <path>", "Path to public key file")
    .action(async (options) => {
      await command.run(() =>
        sshKeyService.add({
          title: options.title,
          key: options.key,
          file: options.file,
        }),
      );
    });

  sshKey
    .command("delete <id>")
    .description("Delete an SSH key.")
    .option("--yes", "Confirm deletion")
    .action(async (id: string, options: { yes?: boolean }) => {
      await command.run(() =>
        sshKeyService.delete(parse.parsePositiveInt(id, "key id"), {
          yes: options.yes,
        }),
      );
    });
};

export default { register };
