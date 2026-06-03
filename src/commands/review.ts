import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import reviewService from "@/services/review";

type ReviewSide = "LEFT" | "RIGHT";

interface ReviewOptions {
  repo?: string;
}

interface LineReviewOptions extends ReviewOptions {
  file?: string;
  line?: string;
}

interface CommentOptions extends LineReviewOptions {
  body?: string;
  side?: string;
}

interface SuggestOptions extends LineReviewOptions {
  replace?: string;
}

interface ApplyOptions extends ReviewOptions {
  push?: boolean;
}

interface PromptOptions {
  placeholder: string;
}

const promptValue = async (
  value: string | undefined,
  message: string,
  options: PromptOptions,
): Promise<string> => value || prompt.text(message, options);

const promptNumber = async (
  value: string | undefined,
  message: string,
  options: PromptOptions,
  label: string,
): Promise<number> =>
  parse.parsePositiveInt(await promptValue(value, message, options), label);

const promptPr = (value: string | undefined): Promise<number> =>
  promptNumber(value, "Enter the PR number:", { placeholder: "42" }, "PR");

const promptThreadId = (value: string | undefined): Promise<number> =>
  promptNumber(
    value,
    "Enter the thread ID:",
    { placeholder: "123456" },
    "thread id",
  );

const promptFile = (value: string | undefined): Promise<string> =>
  promptValue(value, "Enter the file path:", { placeholder: "src/main.ts" });

const promptLine = (value: string | undefined): Promise<number> =>
  promptNumber(value, "Enter the line number:", { placeholder: "10" }, "line");

const promptCommentBody = (value: string | undefined): Promise<string> =>
  promptValue(value, "Enter the comment body:", {
    placeholder: "Consider using a constant here.",
  });

const promptReplacement = (value: string | undefined): Promise<string> =>
  promptValue(value, "Enter the replacement text:", {
    placeholder: "const x = 1;",
  });

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
    .action(async (prArg: string | undefined, options: CommentOptions) => {
      const pr = await promptPr(prArg);
      const file = await promptFile(options.file);
      const line = await promptLine(options.line);
      const body = await promptCommentBody(options.body);

      await command.run(() =>
        reviewService.comment({
          pr,
          file,
          line,
          body,
          side: options.side as ReviewSide,
          repo: options.repo,
        }),
      );
    });

  review
    .command("threads")
    .description("List all review threads on a pull request.")
    .argument("[pr]", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (prArg: string | undefined, options: ReviewOptions) => {
      const pr = await promptPr(prArg);
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
        options: ReviewOptions,
      ) => {
        const threadId = await promptThreadId(threadIdArg);
        const pr = await promptPr(prArg);

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
    .action(async (prArg: string | undefined, options: SuggestOptions) => {
      const pr = await promptPr(prArg);
      const file = await promptFile(options.file);
      const line = await promptLine(options.line);
      const replace = await promptReplacement(options.replace);

      await command.run(() =>
        reviewService.suggest({
          pr,
          file,
          line,
          replace,
          repo: options.repo,
        }),
      );
    });

  review
    .command("apply")
    .description("Apply all suggestions from a pull request as commits.")
    .argument("[pr]", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--push", "Push after applying", false)
    .action(async (prArg: string | undefined, options: ApplyOptions) => {
      const pr = await promptPr(prArg);

      await command.run(() =>
        reviewService.apply(pr, options.repo, options.push),
      );
    });
};

export default { register };
