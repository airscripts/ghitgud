import { Command } from "commander";
import service from "@/services/notifications";

const register = (program: Command) => {
  program
    .command("mentions")
    .description("Find recent @mentions of you.")
    .action(() => void service.mentions());
};

export default { register };
