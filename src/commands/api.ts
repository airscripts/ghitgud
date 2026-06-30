import { Command } from "commander";

import apiService from "@/services/api";

const collect = (value: string, previous: string[]): string[] => [
  ...previous,
  value,
];

const register = (program: Command) => {
  program
    .command("api <endpoint>")
    .description("Make an authenticated GitHub REST API request.")
    .option("--method <method>", "HTTP method")
    .option("--field <key=value>", "Request field", collect, [])
    .option("--paginate", "Fetch and flatten every response page")
    .option("--jq <query>", "Filter JSON with a jq expression")
    .option("--silent", "Suppress response output")
    .action(async (endpoint: string, options) => {
      await apiService.request(endpoint, {
        method: options.method,
        fields: options.field,
        paginate: options.paginate,
        jq: options.jq,
        silent: options.silent,
      });
    });
};

export default { register };
