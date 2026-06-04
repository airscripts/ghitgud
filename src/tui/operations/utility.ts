import proxy from "@/commands/proxy";
import { requiredText } from "./shared";
import type { TuiOperation } from "../types";
import labelsService from "@/services/labels";

const utilityOperations: TuiOperation[] = [
  {
    id: "ping",
    title: "Ping",
    command: "ghg ping",
    workspace: "Utility",
    description: "Check if the CLI is working.",
    run: () => labelsService.ping(),
  },

  {
    id: "version",
    title: "Version",
    command: "ghg version",
    workspace: "Utility",
    description: "Show the current version.",
    run: () => ({ success: true, version: __VERSION__ }),
  },

  {
    id: "proxy",
    mutates: true,
    title: "Proxy to gh",
    workspace: "Utility",
    command: "ghg proxy <args>",
    description: "Pass arguments through to the GitHub CLI.",
    inputs: [{ key: "args", label: "gh args", type: "string", required: true }],

    run: async ({ values }) => {
      const result = await proxy.runProxyCapture(
        requiredText(values, "args").split(/\s+/).filter(Boolean),
      );

      return (
        result.stdout || result.stderr || `Exited with code ${result.exitCode}.`
      );
    },
  },
];

export default utilityOperations;
