import { Command } from "commander";

import command from "@/core/command";
import prompt from "@/core/prompt";
import configService from "@/services/config";

import { SUPPORTED_CONFIG_KEYS } from "@/core/constants";

const register = (program: Command) => {
  const config = program
    .command("config")
    .description("Set CLI configurations.");

  config
    .command("set")
    .description("Set configuration.")
    .arguments("[key] [value]")
    .action(async (key?: string, value?: string) => {
      let configKey = key;

      if (!configKey) {
        configKey = await prompt.select(
          "Which configuration would you like to set?",
          SUPPORTED_CONFIG_KEYS.map((k) => ({
            value: k,
            label: k,
          })),
        );
      }

      let configValue = value;
      if (!configValue) {
        configValue = await prompt.text(`Enter value for ${configKey}:`);
      }

      await command.run(() => configService.set(configKey!, configValue!));
    });

  config
    .command("get")
    .description("Get configuration value.")
    .arguments("[key]")
    .action(async (key?: string) => {
      let configKey = key;

      if (!configKey) {
        configKey = await prompt.select(
          "Which configuration would you like to view?",
          SUPPORTED_CONFIG_KEYS.map((k) => ({
            value: k,
            label: k,
          })),
        );
      }

      await command.run(() => configService.get(configKey!));
    });

  config
    .command("unset")
    .description("Remove configuration value.")
    .arguments("[key]")
    .action(async (key?: string) => {
      let configKey = key;

      if (!configKey) {
        configKey = await prompt.select(
          "Which configuration would you like to remove?",
          SUPPORTED_CONFIG_KEYS.map((k) => ({
            value: k,
            label: k,
          })),
        );
      }

      await command.run(() => configService.unset(configKey!));
    });
};

export default { register };
