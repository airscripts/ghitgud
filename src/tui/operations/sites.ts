import pagesService from "@/services/pages";
import type { TuiOperation } from "../types";
import { inferRepo, repoInput, requiredText, text } from "./shared";

const pagesOperations: TuiOperation[] = [
  {
    id: "pages.status",
    workspace: "Pages",
    title: "Pages Status",
    command: "gitfleet pages status",
    description: "Show the current static site deployment status.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return pagesService.status(repo);
    },
  },
  {
    id: "pages.deploy",
    workspace: "Pages",
    title: "Deploy Pages",
    command: "gitfleet pages deploy --source <branch>",
    description: "Configure a branch source and request a Pages build.",
    mutates: true,

    inputs: [
      repoInput,
      {
        key: "source",
        type: "string",
        required: true,
        label: "Source Branch",
      },
      {
        key: "path",
        type: "string",
        defaultValue: "/",
        label: "Source Path",
        placeholder: "/ or /docs",
      },
      {
        type: "string",
        key: "buildType",
        label: "Build Type",
        defaultValue: "legacy",
        placeholder: "legacy or workflow",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return pagesService.deploy(repo, {
        path: text(values, "path") ?? "/",
        buildType: text(values, "buildType"),
        source: requiredText(values, "source"),
      });
    },
  },
  {
    id: "pages.unpublish",
    workspace: "Pages",
    title: "Unpublish Pages",
    command: "gitfleet pages unpublish --yes",
    description: "Unpublish the static site site.",
    mutates: true,
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return pagesService.unpublish(repo);
    },
  },
];

export default pagesOperations;
