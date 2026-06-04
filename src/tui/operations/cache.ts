import cacheService from "@/services/cache";
import type { TuiOperation } from "../types";
import { repoInput, text, requiredText } from "./shared";

const cacheOperations: TuiOperation[] = [
  {
    workspace: "Cache",
    id: "cache.inspect",
    title: "Inspect Cache",
    command: "ghg cache inspect <key>",
    description: "Inspect GitHub Actions cache metadata.",

    inputs: [
      { key: "key", label: "Cache key", type: "string", required: true },
      repoInput,
    ],

    run: ({ values }) =>
      cacheService.inspect(requiredText(values, "key"), text(values, "repo")),
  },

  {
    mutates: true,
    workspace: "Cache",
    id: "cache.download",
    command: "ghg cache download <key>",
    title: "Download Cache Debug Bundle",
    description: "Download cache-related debug artifacts.",

    inputs: [
      { key: "key", label: "Cache key", type: "string", required: true },
      repoInput,
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: ({ values }) =>
      cacheService.download(requiredText(values, "key"), {
        repo: text(values, "repo"),
        outputDir: text(values, "outputDir"),
      }),
  },
];

export default cacheOperations;
