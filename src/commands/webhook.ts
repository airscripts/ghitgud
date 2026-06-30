import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import webhookService from "@/services/webhook";

const register = (program: Command) => {
  const webhook = program
    .command("webhook")
    .description("Manage repository and organization webhooks.");

  webhook
    .command("list")
    .description("List webhooks.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization")
    .action(async (options: { repo?: string; org?: string }) => {
      if (options.org) {
        await command.run(() => webhookService.listOrg(options.org!));
      } else {
        await command.run(() => webhookService.list({ repo: options.repo }));
      }
    });

  webhook
    .command("create")
    .description("Create a webhook.")
    .requiredOption("--url <url>", "Payload URL")
    .requiredOption("--events <events>", "Events (comma-separated)")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization")
    .option("--secret <secret>", "Webhook secret")
    .option("--content-type <type>", "Content type (json or form)", "json")
    .option("--inactive", "Create as inactive", false)
    .action(async (options) => {
      const events = options.events.split(",").map((e: string) => e.trim());
      await command.run(() =>
        webhookService.create({
          repo: options.repo,
          org: options.org,
          url: options.url,
          events,
          secret: options.secret,
          contentType: options.contentType,
          active: !options.inactive,
        }),
      );
    });

  webhook
    .command("edit <id>")
    .description("Update a webhook.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--url <url>", "New payload URL")
    .option("--events <events>", "New events (comma-separated)")
    .option("--active <boolean>", "Active status")
    .action(async (id: string, options) => {
      const events = options.events
        ? options.events.split(",").map((e: string) => e.trim())
        : undefined;
      await command.run(() =>
        webhookService.edit({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "webhook id"),
          url: options.url,
          events,
          active: options.active,
        }),
      );
    });

  webhook
    .command("delete <id>")
    .description("Delete a webhook.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm deletion", false)
    .action(async (id: string, options: { repo?: string; yes: boolean }) => {
      if (!options.yes) {
        prompt.guardNonInteractive("Webhook deletion requires --yes.");
        if (!(await prompt.confirm(`Delete webhook ${id}?`))) return;
      }
      await command.run(() =>
        webhookService.remove({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "webhook id"),
        }),
      );
    });

  webhook
    .command("test <id>")
    .description("Trigger a test ping for a webhook.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (id: string, options: { repo?: string }) => {
      await command.run(() =>
        webhookService.test({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "webhook id"),
        }),
      );
    });

  const delivery = webhook
    .command("delivery")
    .description("Manage webhook deliveries.");

  delivery
    .command("list <id>")
    .description("List recent deliveries for a webhook.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (id: string, options: { repo?: string }) => {
      await command.run(() =>
        webhookService.deliveries({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "webhook id"),
        }),
      );
    });

  delivery
    .command("view <deliveryId>")
    .description("View delivery details.")
    .requiredOption("--webhook <id>", "Webhook ID")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(
      async (
        deliveryId: string,
        options: { webhook: string; repo?: string },
      ) => {
        await command.run(() =>
          webhookService.delivery({
            repo: options.repo,
            id: parse.parsePositiveInt(options.webhook, "webhook id"),
            deliveryId: parse.parsePositiveInt(deliveryId, "delivery id"),
          }),
        );
      },
    );

  delivery
    .command("redeliver <deliveryId>")
    .description("Redeliver a webhook delivery.")
    .requiredOption("--webhook <id>", "Webhook ID")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(
      async (
        deliveryId: string,
        options: { webhook: string; repo?: string },
      ) => {
        await command.run(() =>
          webhookService.redeliver({
            repo: options.repo,
            id: parse.parsePositiveInt(options.webhook, "webhook id"),
            deliveryId: parse.parsePositiveInt(deliveryId, "delivery id"),
          }),
        );
      },
    );
};

export default { register };
