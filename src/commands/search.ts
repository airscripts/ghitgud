import { Command, Option } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import searchService from "@/services/search";

const register = (program: Command) => {
  const search = program
    .command("search")
    .description("Search resources on the active provider.");

  search
    .command("issues <query>")
    .description("Search issues.")
    .option("--repo <repo>", "Scope to repository (owner/repo)")
    .addOption(
      new Option("--state <state>", "Issue state")
        .choices(["open", "closed", "all"])
        .default("all"),
    )
    .option(
      "--sort <field>",
      "Sort field (updated, comments, created)",
      "updated",
    )
    .option("--order <direction>", "Sort direction (asc, desc)", "desc")
    .option("--limit <number>", "Maximum results", "30")
    .action(
      async (
        query: string,
        options: {
          repo?: string;
          state: string;
          sort: string;
          order: string;
          limit: string;
        },
      ) => {
        await command.run(() =>
          searchService.searchIssues(query, {
            ...(options.repo ? { repo: options.repo } : {}),
            sort: options.sort,
            order: options.order as "asc" | "desc",
            limit: parse.parsePositiveInt(options.limit, "limit"),
            state: options.state === "all" ? undefined : options.state,
          }),
        );
      },
    );

  search
    .command("prs <query>")
    .description("Search proposed changes.")
    .option("--repo <repo>", "Scope to repository (owner/repo)")
    .addOption(
      new Option("--state <state>", "Change state")
        .choices(["open", "closed", "merged", "all"])
        .default("all"),
    )
    .option(
      "--sort <field>",
      "Sort field (updated, comments, created)",
      "updated",
    )
    .option("--order <direction>", "Sort direction (asc, desc)", "desc")
    .option("--limit <number>", "Maximum results", "30")
    .action(
      async (
        query: string,
        options: {
          repo?: string;
          state: string;
          sort: string;
          order: string;
          limit: string;
        },
      ) => {
        await command.run(() =>
          searchService.searchPrs(query, {
            ...(options.repo ? { repo: options.repo } : {}),
            sort: options.sort,
            order: options.order as "asc" | "desc",
            limit: parse.parsePositiveInt(options.limit, "limit"),
            state: options.state === "all" ? undefined : options.state,
          }),
        );
      },
    );

  search
    .command("repos <query>")
    .description("Search repositories.")
    .option("--language <lang>", "Filter by language")
    .option("--sort <field>", "Sort field (stars, forks, updated)", "updated")
    .option("--order <direction>", "Sort direction (asc, desc)", "desc")
    .option("--limit <number>", "Maximum results", "30")
    .action(
      async (
        query: string,
        options: {
          language?: string;
          sort: string;
          order: string;
          limit: string;
        },
      ) => {
        await command.run(() =>
          searchService.searchRepos(query, {
            ...(options.language ? { language: options.language } : {}),
            sort: options.sort,
            order: options.order as "asc" | "desc",
            limit: parse.parsePositiveInt(options.limit, "limit"),
          }),
        );
      },
    );

  search
    .command("code <query>")
    .description("Search code.")
    .option("--repo <repo>", "Scope to repository (owner/repo)")
    .option("--language <lang>", "Filter by language")
    .option("--sort <field>", "Sort field (indexed)", "indexed")
    .option("--limit <number>", "Maximum results", "30")
    .action(
      async (
        query: string,
        options: {
          repo?: string;
          language?: string;
          sort: string;
          limit: string;
        },
      ) => {
        await command.run(() =>
          searchService.searchCode(query, {
            ...(options.repo ? { repo: options.repo } : {}),
            ...(options.language ? { language: options.language } : {}),
            sort: options.sort,
            limit: parse.parsePositiveInt(options.limit, "limit"),
          }),
        );
      },
    );

  search
    .command("commits <query>")
    .description("Search commits.")
    .option("--repo <repo>", "Scope to repository (owner/repo)")
    .option("--author <user>", "Filter by author")
    .option(
      "--sort <field>",
      "Sort field (author-date, committer-date)",
      "author-date",
    )
    .option("--order <direction>", "Sort direction (asc, desc)", "desc")
    .option("--limit <number>", "Maximum results", "30")
    .action(
      async (
        query: string,
        options: {
          sort: string;
          repo?: string;
          order: string;
          limit: string;
          author?: string;
        },
      ) => {
        await command.run(() =>
          searchService.searchCommits(query, {
            ...(options.repo ? { repo: options.repo } : {}),
            ...(options.author ? { author: options.author } : {}),
            sort: options.sort,
            order: options.order as "asc" | "desc",
            limit: parse.parsePositiveInt(options.limit, "limit"),
          }),
        );
      },
    );
};

export default { register };
