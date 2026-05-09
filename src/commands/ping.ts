import { Command } from "commander";
import labelsService from "@/services/labels";

const register = (program: Command) => {
  program
    .command("ping")
    .description("Check if the CLI is working.")
    .action(() => void labelsService.ping());
};

export default { register };
