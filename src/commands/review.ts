import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import reviewService from "@/services/review";

const register = (program: Command) => {
  const review = program
    .command("review")
    .description("Perform code review actions on pull requests.");

  review
    .command("comment")
    .description("Add a line-specific comment to a pull request.")
    .argument("[pr]", "Pull request number")
    .option("--file <path>", "File path to comment on")
    .option("--line <number>", "Line number to comment on")
    .option("--body <text>", "Comment body")
    .option("--side <side>", "Side of diff (LEFT or RIGHT)", "RIGHT")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(
      async (
        prArg: string | undefined,
        options: {
          file?: string;
          line?: string;
          body?: string;
          side?: string;
          repo?: string;
        },
      ) => {
        let pr: number;
        if (prArg) {
          pr = parseInt(prArg, 10);
        } else {
          const input = await prompt.text("Enter the PR number:", {
            placeholder: "42",
          });
          pr = parseInt(input, 10);
        }

        let file: string;
        if (options.file) {
          file = options.file;
        } else {
          file = await prompt.text("Enter the file path:", {
            placeholder: "src/main.ts",
          });
        }

        let line: number;
        if (options.line) {
          line = parseInt(options.line, 10);
        } else {
          const input = await prompt.text("Enter the line number:", {
            placeholder: "10",
          });
          line = parseInt(input, 10);
        }

        let body: string;
        if (options.body) {
          body = options.body;
        } else {
          body = await prompt.text("Enter the comment body:", {
            placeholder: "Consider using a constant here.",
          });
        }

        await command.run(() =>
          reviewService.comment({
            pr,
            file,
            line,
            body,
            side: options.side as "LEFT" | "RIGHT",
            repo: options.repo,
          }),
        );
      },
    );

  review
    .command("threads")
    .description("List all review threads on a pull request.")
    .argument("[pr]", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (prArg: string | undefined, options: { repo?: string }) => {
      let pr: number;
      if (prArg) {
        pr = parseInt(prArg, 10);
      } else {
        const input = await prompt.text("Enter the PR number:", {
          placeholder: "42",
        });
        pr = parseInt(input, 10);
      }

      await command.run(() => reviewService.threads(pr, options.repo));
    });

  review
    .command("resolve")
    .description("Mark a review thread as resolved.")
    .argument("[thread-id]", "Thread ID (top-level comment ID)")
    .argument("[pr]", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(
      async (
        threadIdArg: string | undefined,
        prArg: string | undefined,
        options: { repo?: string },
      ) => {
        let threadId: number;
        if (threadIdArg) {
          threadId = parseInt(threadIdArg, 10);
        } else {
          const input = await prompt.text("Enter the thread ID:", {
            placeholder: "123456",
          });
          threadId = parseInt(input, 10);
        }

        let pr: number;
        if (prArg) {
          pr = parseInt(prArg, 10);
        } else {
          const input = await prompt.text("Enter the PR number:", {
            placeholder: "42",
          });
          pr = parseInt(input, 10);
        }

        await command.run(() =>
          reviewService.resolve(threadId, options.repo, pr),
        );
      },
    );

  review
    .command("suggest")
    .description("Create a suggestion comment on a pull request.")
    .argument("[pr]", "Pull request number")
    .option("--file <path>", "File path")
    .option("--line <number>", "Line number")
    .option("--replace <text>", "Replacement text")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(
      async (
        prArg: string | undefined,
        options: {
          file?: string;
          line?: string;
          replace?: string;
          repo?: string;
        },
      ) => {
        let pr: number;
        if (prArg) {
          pr = parseInt(prArg, 10);
        } else {
          const input = await prompt.text("Enter the PR number:", {
            placeholder: "42",
          });
          pr = parseInt(input, 10);
        }

        let file: string;
        if (options.file) {
          file = options.file;
        } else {
          file = await prompt.text("Enter the file path:", {
            placeholder: "src/main.ts",
          });
        }

        let line: number;
        if (options.line) {
          line = parseInt(options.line, 10);
        } else {
          const input = await prompt.text("Enter the line number:", {
            placeholder: "10",
          });
          line = parseInt(input, 10);
        }

        let replace: string;
        if (options.replace) {
          replace = options.replace;
        } else {
          replace = await prompt.text("Enter the replacement text:", {
            placeholder: "const x = 1;",
          });
        }

        await command.run(() =>
          reviewService.suggest({
            pr,
            file,
            line,
            replace,
            repo: options.repo,
          }),
        );
      },
    );

  review
    .command("apply")
    .description("Apply all suggestions from a pull request as commits.")
    .argument("[pr]", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--push", "Push after applying", false)
    .action(
      async (
        prArg: string | undefined,
        options: { repo?: string; push?: boolean },
      ) => {
        let pr: number;
        if (prArg) {
          pr = parseInt(prArg, 10);
        } else {
          const input = await prompt.text("Enter the PR number:", {
            placeholder: "42",
          });
          pr = parseInt(input, 10);
        }

        await command.run(() =>
          reviewService.apply(pr, options.repo, options.push),
        );
      },
    );
};

export default { register };
