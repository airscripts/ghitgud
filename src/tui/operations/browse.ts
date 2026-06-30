import type { TuiOperation } from "../types";
import browseService from "@/services/browse";
import { text, repoInput, inferRepo } from "./shared";

const browseOperations: TuiOperation[] = [
  {
    workspace: "Utility",
    id: "browse.repo",
    title: "Open Repository",
    command: "ghg browse repo",
    description: "Open the repository in the browser.",
    inputs: [
      repoInput,
      { key: "path", label: "File path", type: "string" },
      { key: "line", label: "Line number", type: "number" },
    ],
    run: async ({ values }) =>
      browseService.browseRepo({
        repo: text(values, "repo") || (await inferRepo()),
        path: text(values, "path"),
        line: text(values, "line"),
      }),
  },
  {
    workspace: "Utility",
    id: "browse.issues",
    title: "Open Issues",
    command: "ghg browse issues",
    description: "Open the issues page in the browser.",
    inputs: [repoInput],
    run: async ({ values }) =>
      browseService.browseIssues({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Utility",
    id: "browse.pulls",
    title: "Open Pull Requests",
    command: "ghg browse pulls",
    description: "Open the pull requests page in the browser.",
    inputs: [repoInput],
    run: async ({ values }) =>
      browseService.browsePulls({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Utility",
    id: "browse.actions",
    title: "Open Actions",
    command: "ghg browse actions",
    description: "Open the actions page in the browser.",
    inputs: [repoInput],
    run: async ({ values }) =>
      browseService.browseActions({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Utility",
    id: "browse.releases",
    title: "Open Releases",
    command: "ghg browse releases",
    description: "Open the releases page in the browser.",
    inputs: [repoInput],
    run: async ({ values }) =>
      browseService.browseReleases({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
];

export default browseOperations;
