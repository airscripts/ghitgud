import searchService from "@/services/search";
import type { TuiOperation } from "../types";

import {
  text,
  repoInput,
  numberValue,
  requiredText,
  inferRepoOptional,
} from "./shared";

const searchOperations: TuiOperation[] = [
  {
    workspace: "Search",
    id: "search.issues",
    title: "Search Issues",
    command: "ghg search issues <query>",
    description: "Search issues across GitHub.",

    inputs: [
      { key: "query", label: "Query", type: "string", required: true },
      repoInput,

      {
        key: "state",
        label: "State (open/closed/all)",
        type: "string",
        defaultValue: "all",
      },

      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],

    run: async ({ values }) => {
      const repo =
        text(values, "repo") || (await inferRepoOptional()) || undefined;

      const stateValue = text(values, "state");

      return searchService.searchIssues(requiredText(values, "query"), {
        ...(repo ? { repo } : {}),
        ...(stateValue && stateValue !== "all" ? { state: stateValue } : {}),
        limit: numberValue(values, "limit"),
      });
    },
  },

  {
    workspace: "Search",
    id: "search.prs",
    title: "Search Pull Requests",
    command: "ghg search prs <query>",
    description: "Search pull requests across GitHub.",

    inputs: [
      { key: "query", label: "Query", type: "string", required: true },
      repoInput,

      {
        key: "state",
        label: "State (open/closed/merged/all)",
        type: "string",
        defaultValue: "all",
      },

      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],

    run: async ({ values }) => {
      const repo =
        text(values, "repo") || (await inferRepoOptional()) || undefined;

      const stateValue = text(values, "state");

      return searchService.searchPrs(requiredText(values, "query"), {
        ...(repo ? { repo } : {}),
        ...(stateValue && stateValue !== "all" ? { state: stateValue } : {}),
        limit: numberValue(values, "limit"),
      });
    },
  },

  {
    workspace: "Search",
    id: "search.repos",
    title: "Search Repositories",
    command: "ghg search repos <query>",
    description: "Search repositories on GitHub.",

    inputs: [
      { key: "query", label: "Query", type: "string", required: true },
      { key: "language", label: "Language", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],

    run: async ({ values }) => {
      const language = text(values, "language");

      return searchService.searchRepos(requiredText(values, "query"), {
        ...(language ? { language } : {}),
        limit: numberValue(values, "limit"),
      });
    },
  },

  {
    workspace: "Search",
    id: "search.code",
    title: "Search Code",
    command: "ghg search code <query>",
    description: "Search code across GitHub repositories.",

    inputs: [
      { key: "query", label: "Query", type: "string", required: true },
      repoInput,
      { key: "language", label: "Language", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],

    run: async ({ values }) => {
      const repo =
        text(values, "repo") || (await inferRepoOptional()) || undefined;

      const language = text(values, "language");

      return searchService.searchCode(requiredText(values, "query"), {
        ...(repo ? { repo } : {}),
        ...(language ? { language } : {}),
        limit: numberValue(values, "limit"),
      });
    },
  },

  {
    workspace: "Search",
    id: "search.commits",
    title: "Search Commits",
    command: "ghg search commits <query>",
    description: "Search commits across GitHub repositories.",

    inputs: [
      { key: "query", label: "Query", type: "string", required: true },
      repoInput,
      { key: "author", label: "Author", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],

    run: async ({ values }) => {
      const repo =
        text(values, "repo") || (await inferRepoOptional()) || undefined;

      const author = text(values, "author");

      return searchService.searchCommits(requiredText(values, "query"), {
        ...(repo ? { repo } : {}),
        ...(author ? { author } : {}),
        limit: numberValue(values, "limit"),
      });
    },
  },
];

export default searchOperations;
