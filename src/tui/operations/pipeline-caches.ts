import cacheService from "@/services/cache";
import type { TuiOperation } from "../types";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
  booleanValue,
} from "./shared";

const cacheOperations: TuiOperation[] = [
  {
    workspace: "Cache",
    id: "cache.list",
    title: "List Caches",
    command: "gitfleet cache list",
    description: "List pipeline caches.",
    inputs: [
      repoInput,
      { key: "key", label: "Key or prefix", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: async ({ values }) =>
      cacheService.list({
        repo: text(values, "repo") || (await inferRepo()),
        key: text(values, "key"),
        limit: numberValue(values, "limit"),
      }),
  },
  {
    mutates: true,
    workspace: "Cache",
    id: "cache.delete",
    title: "Delete Cache",
    command: "gitfleet cache delete <key>",
    description: "Delete pipeline caches by key.",
    inputs: [
      repoInput,
      { key: "key", label: "Cache key", type: "string", required: true },
      { key: "all", label: "Delete prefix matches", type: "boolean" },
    ],
    run: async ({ values }) =>
      cacheService.remove(requiredText(values, "key"), {
        repo: text(values, "repo") || (await inferRepo()),
        all: booleanValue(values, "all"),
      }),
  },
  {
    workspace: "Cache",
    id: "cache.inspect",
    title: "Inspect Cache",
    command: "gitfleet cache inspect <key>",
    description: "Inspect pipeline cache metadata.",

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
    command: "gitfleet cache download <key>",
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

const operationOrder = [
  "cache.inspect",
  "cache.download",
  "cache.list",
  "cache.delete",
];

cacheOperations.sort(
  (left, right) =>
    operationOrder.indexOf(left.id) - operationOrder.indexOf(right.id),
);

export default cacheOperations;
