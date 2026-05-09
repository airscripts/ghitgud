import { Command } from "commander";
import configService from "@/services/config";

const register = (program: Command) => {
  const config = program
    .command("config")
    .description("Set CLI configurations.");

  config
    .command("set")
    .description("Set configuration.")
    .arguments("<key> <value>")
    .action((key: string, value: string) => {
      configService.set(key, value);
    });

  config
    .command("get")
    .description("Get configuration value.")
    .arguments("<key>")
    .action((key: string) => {
      configService.get(key);
    });
};

export default { register };
