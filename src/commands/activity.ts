import { Command } from "commander";
import service from "@/services/notifications";

const register = (program: Command) => {
  program
    .command("activity")
    .description("Show assigned issues, review requests, and mentions.")
    .action(() => void service.activity());
};

export default { register };
