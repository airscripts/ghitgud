import { Command } from "commander";

import command from "@/core/command";
import auditService from "@/services/audit";

const register = (program: Command) => {
  program
    .command("audit")
    .description("Query GitHub organization or enterprise audit logs.")
    .option("--org <org>", "Organization login")
    .option("--enterprise <slug>", "Enterprise slug")
    .option("--actor <actor>", "Filter by actor")
    .option("--action <action>", "Filter by audit action")
    .option("--repo <repo>", "Filter by repository")
    .option("--after <date>", "Filter events after an ISO date")
    .option("--before <date>", "Filter events before an ISO date")
    .option("--include <include>", "Audit include mode")
    .option("--order <order>", "Sort order, asc or desc", "desc")
    .option("--limit <number>", "Maximum events to render")
    .action(async (options) => {
      await command.run(() => auditService.list(options));
    });
};

export default { register };
