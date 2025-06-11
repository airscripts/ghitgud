import { program, Command } from "commander";
import library from "./library";

const COMMANDS = {
  ping: {
    name: "ping",
    action: () => library.ping(),
    description: "Check if the CLI is working.",
  },

  labels: {
    name: "labels",
    description: "Manage labels for a repository.",

    commands: {
      list: {
        name: "list",
        description: "List all labels for a repository.",
        action: () => library.labels.list(),
      },

      pull: {
        name: "pull",
        description: "Pull all related labels for a repository.",
        action: () => library.labels.pull(),
      },

      push: {
        name: "push",
        description: "Push all related labels for a repository.",
        action: () => library.labels.push(),
      },

      prune: {
        name: "prune",
        description: "Prune all related labels for a repository.",
        action: () => library.labels.prune(),
      },
    },
  },
};

const init = () => {
  program
    .command(COMMANDS.ping.name)
    .description(COMMANDS.ping.description)
    .action(COMMANDS.ping.action);

  const labels = program
    .command(COMMANDS.labels.name)
    .description(COMMANDS.labels.description);

  labels.addCommand(
    new Command(COMMANDS.labels.commands.list.name)
      .description(COMMANDS.labels.commands.list.description)
      .action(COMMANDS.labels.commands.list.action)
  );

  labels.addCommand(
    new Command(COMMANDS.labels.commands.pull.name)
      .description(COMMANDS.labels.commands.pull.description)
      .action(COMMANDS.labels.commands.pull.action)
  );

  labels.addCommand(
    new Command(COMMANDS.labels.commands.push.name)
      .description(COMMANDS.labels.commands.push.description)
      .action(COMMANDS.labels.commands.push.action)
  );

  labels.addCommand(
    new Command(COMMANDS.labels.commands.prune.name)
      .description(COMMANDS.labels.commands.prune.description)
      .action(COMMANDS.labels.commands.prune.action)
  );
};

export default init;
