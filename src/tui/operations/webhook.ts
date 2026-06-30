import type { TuiOperation } from "../types";
import webhookService from "@/services/webhook";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const webhookOperations: TuiOperation[] = [
  {
    workspace: "Webhooks",
    id: "webhook.list",
    title: "List Webhooks",
    command: "ghg webhook list",
    description: "List repository webhooks.",
    inputs: [repoInput],
    run: async ({ values }) =>
      webhookService.list({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    mutates: true,
    workspace: "Webhooks",
    id: "webhook.create",
    title: "Create Webhook",
    command: "ghg webhook create --url <url> --events <events>",
    description: "Create a new webhook.",
    inputs: [
      repoInput,
      {
        key: "url",
        label: "Payload URL",
        type: "string",
        required: true,
      },
      {
        key: "events",
        label: "Events (comma-separated)",
        type: "string",
        required: true,
      },
      { key: "secret", label: "Secret", type: "string", secret: true },
      {
        key: "contentType",
        label: "Content type",
        type: "string",
        defaultValue: "json",
      },
    ],
    run: async ({ values }) =>
      webhookService.create({
        repo: text(values, "repo") || (await inferRepo()),
        url: requiredText(values, "url"),
        events: requiredText(values, "events")
          .split(",")
          .map((e) => e.trim()),
        secret: text(values, "secret"),
        contentType: text(values, "contentType") ?? "json",
        active: true,
      }),
  },
  {
    mutates: true,
    workspace: "Webhooks",
    id: "webhook.delete",
    title: "Delete Webhook",
    command: "ghg webhook delete <id> --yes",
    description: "Delete a webhook.",
    inputs: [
      repoInput,
      { key: "id", label: "Webhook ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      webhookService.remove({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
      }),
  },
  {
    workspace: "Webhooks",
    id: "webhook.test",
    title: "Test Webhook",
    command: "ghg webhook test <id>",
    description: "Trigger a test ping for a webhook.",
    inputs: [
      repoInput,
      { key: "id", label: "Webhook ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      webhookService.test({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
      }),
  },
  {
    workspace: "Webhooks",
    id: "webhook.delivery.list",
    title: "List Deliveries",
    command: "ghg webhook delivery list <id>",
    description: "List recent deliveries for a webhook.",
    inputs: [
      repoInput,
      { key: "id", label: "Webhook ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      webhookService.deliveries({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
      }),
  },
  {
    workspace: "Webhooks",
    id: "webhook.delivery.view",
    title: "View Delivery",
    command: "ghg webhook delivery view <deliveryId> --webhook <id>",
    description: "View delivery request and response details.",
    inputs: [
      repoInput,
      { key: "id", label: "Webhook ID", type: "number", required: true },
      {
        key: "deliveryId",
        label: "Delivery ID",
        type: "number",
        required: true,
      },
    ],
    run: async ({ values }) =>
      webhookService.delivery({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
        deliveryId: numberValue(values, "deliveryId"),
      }),
  },
  {
    mutates: true,
    workspace: "Webhooks",
    id: "webhook.delivery.redeliver",
    title: "Redeliver Delivery",
    command: "ghg webhook delivery redeliver <deliveryId> --webhook <id>",
    description: "Redeliver a webhook delivery.",
    inputs: [
      repoInput,
      { key: "id", label: "Webhook ID", type: "number", required: true },
      {
        key: "deliveryId",
        label: "Delivery ID",
        type: "number",
        required: true,
      },
    ],
    run: async ({ values }) =>
      webhookService.redeliver({
        repo: text(values, "repo") || (await inferRepo()),
        id: numberValue(values, "id"),
        deliveryId: numberValue(values, "deliveryId"),
      }),
  },
];

export default webhookOperations;
