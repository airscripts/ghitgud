import cacheService from "@/services/cache";
import type { TuiOperation } from "../types";
import { text, requiredText, repoInput, inferRepo } from "./shared";

const cacheOperations: TuiOperation[] = [
  {
    workspace: "Cache",
    id: "cache.inspect",
    title: "Inspect Cache",
    command: "ghg cache inspect <key>",
    description: "Inspect GitHub Actions cache metadata.",

    inputs: [
      repoInput,
      { key: "key", label: "Cache key", type: "string", required: true },
    ],

    run: async ({ values }) =>
      cacheService.inspect(
        requiredText(values, "key"),
        text(values, "repo") || (await inferRepo()),
      ),
  },

  {
    mutates: true,
    workspace: "Cache",
    id: "cache.download",
    command: "ghg cache download <key>",
    title: "Download Cache Debug Bundle",
    description: "Download cache-related debug artifacts.",

    inputs: [
      repoInput,
      { key: "key", label: "Cache key", type: "string", required: true },
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: async ({ values }) =>
      cacheService.download(requiredText(values, "key"), {
        repo: text(values, "repo") || (await inferRepo()),
        outputDir: text(values, "outputDir"),
      }),
  },
];

export default cacheOperations;
