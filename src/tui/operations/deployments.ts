import type { TuiOperation } from "../types";
import deploymentService from "@/services/deployment";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const deploymentOperations: TuiOperation[] = [
  {
    workspace: "Deployments",
    id: "deployment.list",
    title: "List Deployments",
    command: "ghg deployment list",
    description: "List repository deployments.",
    inputs: [
      repoInput,
      { key: "environment", label: "Environment", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: async ({ values }) =>
      deploymentService.list({
        repo: text(values, "repo") || (await inferRepo()),
        environment: text(values, "environment"),
        limit: numberValue(values, "limit"),
      }),
  },
  {
    workspace: "Deployments",
    id: "deployment.view",
    title: "View Deployment",
    command: "ghg deployment view <id>",
    description: "View deployment details.",
    inputs: [
      repoInput,
      { key: "id", label: "Deployment ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      deploymentService.view({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
      }),
  },
  {
    mutates: true,
    workspace: "Deployments",
    id: "deployment.create",
    title: "Create Deployment",
    command: "ghg deployment create --ref <ref> --environment <env>",
    description: "Create a new deployment.",
    inputs: [
      repoInput,
      { key: "ref", label: "Git ref", type: "string", required: true },
      {
        key: "environment",
        label: "Environment",
        type: "string",
        required: true,
      },
      { key: "description", label: "Description", type: "string" },
    ],
    run: async ({ values }) =>
      deploymentService.create({
        repo: text(values, "repo") || (await inferRepo()),
        ref: requiredText(values, "ref"),
        environment: requiredText(values, "environment"),
        description: text(values, "description"),
      }),
  },
  {
    workspace: "Deployments",
    id: "deployment.status",
    title: "List Deployment Statuses",
    command: "ghg deployment status <id>",
    description: "List statuses for a deployment.",
    inputs: [
      repoInput,
      { key: "id", label: "Deployment ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      deploymentService.status({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
      }),
  },
];

export default deploymentOperations;
