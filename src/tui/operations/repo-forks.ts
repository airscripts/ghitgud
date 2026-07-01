import type { TuiOperation } from "../types";
import forkService from "@/services/fork";
import { text, inferRepo } from "./shared";

const forkOperations: TuiOperation[] = [
  {
    workspace: "Forks",
    id: "fork.sync",
    title: "Sync Fork",
    command: "gitfleet fork sync",
    description: "Fast-forward a fork from its upstream.",
    mutates: true,
    inputs: [
      {
        key: "repo",
        label: "Repository",
        type: "string",
        placeholder: "owner/repo",
      },
      { key: "branch", label: "Branch", type: "string" },
    ],
    run: async ({ values }) =>
      forkService.sync({
        repo: text(values, "repo") || (await inferRepo()),
        branch: text(values, "branch"),
      }),
  },
  {
    workspace: "Forks",
    id: "fork.compare",
    title: "Compare Fork",
    command: "gitfleet fork compare",
    description: "Show ahead/behind status against upstream.",
    inputs: [
      {
        key: "repo",
        label: "Repository",
        type: "string",
        placeholder: "owner/repo",
      },
      {
        key: "upstream",
        label: "Upstream",
        type: "string",
        placeholder: "owner/upstream",
      },
      { key: "branch", label: "Branch", type: "string" },
    ],
    run: async ({ values }) =>
      forkService.compare({
        repo: text(values, "repo") || (await inferRepo()),
        upstream: text(values, "upstream"),
        branch: text(values, "branch"),
      }),
  },
  {
    workspace: "Forks",
    id: "fork.list",
    title: "List Forks",
    command: "gitfleet fork list",
    description: "List forks of a repository.",
    inputs: [
      {
        key: "repo",
        label: "Repository",
        type: "string",
        placeholder: "owner/repo",
      },
    ],
    run: async ({ values }) =>
      forkService.list({ repo: text(values, "repo") || (await inferRepo()) }),
  },
  {
    workspace: "Forks",
    id: "fork.create",
    title: "Create Fork",
    command: "gitfleet fork create <repo>",
    description: "Create a fork of a repository.",
    mutates: true,
    inputs: [
      {
        key: "repo",
        label: "Source repository",
        type: "string",
        required: true,
        placeholder: "owner/repo",
      },
      { key: "org", label: "Organization", type: "string" },
    ],
    run: async ({ values }) =>
      forkService.create({
        repo: text(values, "repo")!,
        org: text(values, "org"),
      }),
  },
];

export default forkOperations;
