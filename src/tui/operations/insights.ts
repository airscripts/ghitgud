import type { TuiOperation } from "../types";
import { repoInput, repoValue } from "./shared";
import insightsService from "@/services/insights";

const insightsOperations: TuiOperation[] = [
  {
    workspace: "Insights",
    id: "insights.traffic",
    title: "Traffic Insights",
    command: "ghg insights traffic",
    description: "Show repository traffic.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.traffic(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.contributors",
    title: "Contributor Insights",
    command: "ghg insights contributors",
    description: "Show top contributors.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.contributors(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.commits",
    title: "Commit Insights",
    command: "ghg insights commits",
    description: "Show commit activity.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.commits(repoValue(values)),
  },

  {
    workspace: "Insights",
    title: "Code Frequency",
    id: "insights.frequency",
    command: "ghg insights frequency",
    description: "Show code frequency.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.codeFrequency(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.popularity",
    title: "Popularity Insights",
    command: "ghg insights popularity",
    description: "Show referrers and popular paths.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.popularity(repoValue(values)),
  },

  {
    workspace: "Insights",
    id: "insights.participation",
    title: "Participation Insights",
    command: "ghg insights participation",
    description: "Show participation stats.",
    inputs: [repoInput],
    run: ({ values }) => insightsService.participation(repoValue(values)),
  },
];

export default insightsOperations;
