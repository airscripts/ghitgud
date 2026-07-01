import { Command, Option } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import issueService from "@/services/issue";
import { GitfleetError } from "@/core/errors";
import outputState from "@/core/output-state";

type IssueState = "open" | "closed" | "all";

const collect = (value: string, previous: string[]): string[] => [
  ...previous,
  value,
];

const stateOption = new Option(
  "--state <state>",
  "Issue state (open, closed, all)",
)
  .choices(["open", "closed", "all"])
  .default("open");

const resolve = (repo?: string) => repoResolver.resolveRepo(repo);

const register = (program: Command) => {
  const issue = program.command("issue").description("Manage issues.");

  issue
    .command("create")
    .description("Create an issue.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--title <title>", "Issue title")
    .option("--body <body>", "Issue body")
    .option("--label <label>", "Label (repeatable)", collect, [])
    .option("--assignee <user>", "Assignee (repeatable)", collect, [])
    .option("--type <type>", "Issue type")
    .action(async (options) => {
      const repo = await resolve(options.repo);

      await command.run(() =>
        issueService.create(repo, {
          type: options.type,
          body: options.body,
          title: options.title,
          labels: options.label,
          assignees: options.assignee,
        }),
      );
    });

  issue
    .command("list")
    .description("List issues.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(stateOption)
    .option("--label <label>", "Label filter (repeatable)", collect, [])
    .option("--assignee <user>", "Assignee filter (repeatable)", collect, [])
    .option("--limit <number>", "Maximum issues", "10")
    .action(
      async (options: {
        repo?: string;
        limit: string;
        label: string[];
        state: IssueState;
        assignee: string[];
      }) => {
        const repo = await resolve(options.repo);

        await command.run(() =>
          issueService.list(repo, {
            state: options.state,
            labels: options.label,
            assignees: options.assignee,
            limit: parse.parsePositiveInt(options.limit, "limit"),
          }),
        );
      },
    );

  issue
    .command("view")
    .description("View an issue.")
    .argument("<number>", "Issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (number: string, options: { repo?: string }) => {
      const repo = await resolve(options.repo);
      await command.run(() => issueService.view(repo, number));
    });

  issue
    .command("edit")
    .description("Edit an issue.")
    .argument("<number>", "Issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--title <title>", "Replacement title")
    .option("--body <body>", "Replacement body")
    .option("--remove-body", "Clear the issue body", false)
    .action(async (number: string, options) => {
      const repo = await resolve(options.repo);
      await command.run(() => issueService.edit(repo, number, options));
    });

  for (const [name, description] of [
    ["lock", "Lock an issue conversation."],
    ["unlock", "Unlock an issue conversation."],
    ["pin", "Pin an issue."],
    ["unpin", "Unpin an issue."],
  ] as const) {
    issue
      .command(name)
      .description(description)
      .argument("<number>", "Issue number")
      .option("--repo <repo>", "Repository (owner/repo)")
      .action(async (number: string, options: { repo?: string }) => {
        const repo = await resolve(options.repo);

        await command.run(
          async (): Promise<unknown> => issueService[name](repo, number),
        );
      });
  }

  issue
    .command("close")
    .description("Close an issue.")
    .argument("<number>", "Issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--comment <body>", "Add a comment when closing")
    .action(
      async (number: string, options: { repo?: string; comment?: string }) => {
        const repo = await resolve(options.repo);

        await command.run(() =>
          issueService.closeWithComment(repo, number, options.comment),
        );
      },
    );

  issue
    .command("reopen")
    .description("Reopen an issue.")
    .argument("<number>", "Issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--comment <body>", "Add a comment when reopening")
    .action(
      async (number: string, options: { repo?: string; comment?: string }) => {
        const repo = await resolve(options.repo);

        await command.run(() =>
          issueService.reopenWithComment(repo, number, options.comment),
        );
      },
    );

  issue
    .command("comment")
    .description("Comment on an issue.")
    .argument("<number>", "Issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--body <body>", "Comment body")
    .action(
      async (number: string, options: { repo?: string; body: string }) => {
        const repo = await resolve(options.repo);

        await command.run(() =>
          issueService.comment(repo, number, options.body),
        );
      },
    );

  issue
    .command("delete")
    .description("Permanently delete an issue.")
    .argument("<number>", "Issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm deletion", false)
    .action(
      async (number: string, options: { repo?: string; yes: boolean }) => {
        const repo = await resolve(options.repo);

        if (!options.yes) {
          if (!outputState.isHumanOutput()) {
            throw new GitfleetError("Use --yes to confirm issue deletion.");
          }

          if (!(await prompt.confirm(`Permanently delete ${repo}#${number}?`)))
            return;
        }

        await command.run(() => issueService.delete(repo, number));
      },
    );

  issue
    .command("transfer")
    .description("Transfer an issue to another repository.")
    .argument("<number>", "Issue number")
    .requiredOption("--repo <repo>", "Target repository (owner/repo)")
    .option("--source-repo <repo>", "Source repository (owner/repo)")
    .action(
      async (
        number: string,
        options: { repo: string; sourceRepo?: string },
      ) => {
        const sourceRepo = await resolve(options.sourceRepo);

        await command.run(() =>
          issueService.transfer(sourceRepo, number, options.repo),
        );
      },
    );

  issue
    .command("status")
    .description("Show assigned, created, and mentioned open issues.")
    .option("--repo <repo>", "Filter by repository")
    .action(async (options: { repo?: string }) => {
      const repo = options.repo ? await resolve(options.repo) : undefined;
      await command.run(() => issueService.status(repo));
    });

  issue
    .command("subtasks")
    .description("List, create, or link sub-issues.")
    .argument("<issue>", "Parent issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--create", "Create a new sub-issue", false)
    .option("--title <title>", "Title for a created sub-issue")
    .option("--body <body>", "Body for a created sub-issue")
    .option("--link <issue>", "Existing issue number to link")
    .action(async (issueNumber: string, options) => {
      const repo = await resolve(options.repo);
      await command.run(() =>
        issueService.subtasks(repo, issueNumber, options),
      );
    });

  issue
    .command("parent")
    .description("Link an issue to a parent issue.")
    .argument("<child>", "Child issue number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--parent <parent>", "Parent issue number")
    .action(async (child: string, options) => {
      const repo = await resolve(options.repo);
      await command.run(() => issueService.parent(repo, child, options));
    });

  issue
    .command("type")
    .description("List available issue types for the repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      await command.run(() => issueService.typeList({ repo: options.repo }));
    });
};

export default { register };
