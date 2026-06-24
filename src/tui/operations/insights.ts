import type { TuiOperation } from "../types";
import insightsService from "@/services/insights";
import { text, repoInput, inferRepo } from "./shared";

const insightsOperations: TuiOperation[] = [
  {
    workspace: "Insights",
    id: "insights.traffic",
    title: "Traffic Insights",
    command: "ghg insights traffic",
    description: "Show repository traffic.",
    inputs: [repoInput],

    run: async ({ values }) =>
      insightsService.traffic(text(values, "repo") || (await inferRepo())),
  },

  {
    workspace: "Insights",
    id: "insights.contributors",
    title: "Contributor Insights",
    command: "ghg insights contributors",
    description: "Show top contributors.",
    inputs: [repoInput],

    run: async ({ values }) =>
      insightsService.contributors(text(values, "repo") || (await inferRepo())),
  },

  {
    workspace: "Insights",
    id: "insights.commits",
    title: "Commit Insights",
    command: "ghg insights commits",
    description: "Show commit activity.",
    inputs: [repoInput],

    run: async ({ values }) =>
      insightsService.commits(text(values, "repo") || (await inferRepo())),
  },

  {
    workspace: "Insights",
    title: "Code Frequency",
    id: "insights.frequency",
    command: "ghg insights frequency",
    description: "Show code frequency.",
    inputs: [repoInput],

    run: async ({ values }) =>
      insightsService.codeFrequency(
        text(values, "repo") || (await inferRepo()),
      ),
  },

  {
    workspace: "Insights",
    id: "insights.popularity",
    title: "Popularity Insights",
    command: "ghg insights popularity",
    description: "Show referrers and popular paths.",
    inputs: [repoInput],

    run: async ({ values }) =>
      insightsService.popularity(text(values, "repo") || (await inferRepo())),
  },

  {
    workspace: "Insights",
    id: "insights.participation",
    title: "Participation Insights",
    command: "ghg insights participation",
    description: "Show participation stats.",
    inputs: [repoInput],

    run: async ({ values }) =>
      insightsService.participation(
        text(values, "repo") || (await inferRepo()),
      ),
  },
];

export default insightsOperations;
