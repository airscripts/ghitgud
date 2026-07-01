import wikiService from "@/services/wiki";
import type { TuiOperation } from "../types";
import { inferRepo, repoInput, requiredText, text } from "./shared";

const pageInput = {
  key: "page",
  label: "Page",
  required: true,
  type: "string" as const,
};

const wikiFileInput = {
  key: "file",
  required: true,
  label: "Source File",
  type: "string" as const,
};

const wikiOperations: TuiOperation[] = [
  {
    id: "wiki.list",
    workspace: "Wiki",
    title: "List Wiki Pages",
    command: "gitfleet wiki list",
    description: "List repository wiki pages.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return wikiService.list(repo);
    },
  },
  {
    id: "wiki.view",
    workspace: "Wiki",
    title: "View Wiki Page",
    command: "gitfleet wiki view <page>",
    description: "View a wiki page's source.",
    inputs: [repoInput, pageInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return wikiService.view(repo, requiredText(values, "page"));
    },
  },
  {
    mutates: true,
    id: "wiki.edit",
    workspace: "Wiki",
    title: "Edit Wiki Page",
    command: "gitfleet wiki edit <page> --file <path>",
    description: "Replace an existing wiki page from a file.",
    inputs: [repoInput, pageInput, wikiFileInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return wikiService.edit(
        repo,
        requiredText(values, "page"),
        requiredText(values, "file"),
      );
    },
  },
  {
    mutates: true,
    id: "wiki.create",
    workspace: "Wiki",
    title: "Create Wiki Page",
    command: "gitfleet wiki create <page> --file <path>",
    description: "Create and publish a wiki page from a file.",
    inputs: [repoInput, pageInput, wikiFileInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return wikiService.create(
        repo,
        requiredText(values, "page"),
        requiredText(values, "file"),
      );
    },
  },
  {
    mutates: true,
    id: "wiki.delete",
    workspace: "Wiki",
    title: "Delete Wiki Page",
    command: "gitfleet wiki delete <page>",
    description: "Delete a wiki page.",
    inputs: [repoInput, pageInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return wikiService.delete(repo, requiredText(values, "page"));
    },
  },
];

export default wikiOperations;
