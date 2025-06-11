import { program, Command } from "commander";
import library from "./library";

const COMMANDS = {
  ping: {
    name: "ping",
    action: () => void library.ping(),
    description: "Check if the CLI is working.",
  },

  labels: {
    name: "labels",
    description: "Manage labels for a repository.",

    commands: {
      list: {
        name: "list",
        description: "List all labels for a repository.",
        action: () => void library.labels.list(),
      },

      pull: {
        name: "pull",
        description: "Pull all related labels for a repository.",
        action: () => void library.labels.pull(),
      },

      push: {
        name: "push",
        description: "Push all related labels for a repository.",
        action: () => void library.labels.push(),
      },

      prune: {
        name: "prune",
        description: "Prune all related labels for a repository.",
        action: () => void library.labels.prune(),
      },
    },
  },

  config: {
    name: "config",
    description: "Set CLI configurations.",

    commands: {
      set: {
        name: "set",
        description: "Set configuration.",

        action: (key: string, value: string) =>
          void library.config.set(key, value),
      },
    },
  },
};

const ping = () => {
  program
    .command(COMMANDS.ping.name)
    .description(COMMANDS.ping.description)
    .action(COMMANDS.ping.action);
};

const labels = () => {
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

const config = () => {
  const config = program
    .command(COMMANDS.config.name)
    .description(COMMANDS.config.description);

  config.addCommand(
    new Command(COMMANDS.config.commands.set.name)
      .description(COMMANDS.config.commands.set.description)
      .arguments("<key> <value>")

      .action((key: string, value: string) =>
        COMMANDS.config.commands.set.action(key, value)
      )
  );
};

const init = () => {
  ping();
  labels();
  config();
};

export default init;
