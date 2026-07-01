import type { TuiOperation } from "../types";
import invitesService from "@/services/invites";
import repositoryService from "@/services/repository";
import { GitfleetError } from "@/core/errors";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  booleanValue,
  requiredText,
} from "./shared";

const repoOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "repo.create",
    title: "Create Repository",
    workspace: "Repository Access",
    command: "gitfleet repo create <name>",
    description: "Create a personal or organization repository.",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "owner", label: "Owner", type: "string" },

      {
        key: "ownerType",
        label: "Owner type",
        type: "string",
        defaultValue: "user",
      },

      {
        key: "visibility",
        label: "Visibility",
        type: "string",
        defaultValue: "public",
      },

      { key: "description", label: "Description", type: "string" },
      { key: "template", label: "Template", type: "string" },
    ],

    run: ({ values }) =>
      repositoryService.create({
        name: requiredText(values, "name"),
        owner: text(values, "owner"),
        ownerType: (text(values, "ownerType") ?? "user") as "user" | "org",

        visibility: (text(values, "visibility") ?? "public") as
          | "public"
          | "private"
          | "internal",

        description: text(values, "description"),
        template: text(values, "template"),
      }),
  },

  {
    id: "repo.list",
    workspace: "Repository Access",
    title: "List Repositories",
    description: "List repositories for a user or organization.",
    command: "gitfleet repo list",

    inputs: [
      { key: "owner", label: "Owner", type: "string" },

      {
        key: "ownerType",
        label: "Owner type",
        type: "string",
        defaultValue: "user",
      },

      { key: "type", label: "Type", type: "string", defaultValue: "all" },
    ],

    run: ({ values }) =>
      repositoryService.list({
        owner: text(values, "owner"),
        ownerType: (text(values, "ownerType") ?? "user") as "user" | "org",
        type: (text(values, "type") ?? "all") as "public" | "private" | "all",
      }),
  },

  {
    id: "repo.view",
    title: "View Repository",
    workspace: "Repository Access",
    description: "View repository details.",
    command: "gitfleet repo view",
    inputs: [repoInput],

    run: async ({ values }) =>
      repositoryService.view(text(values, "repo") || (await inferRepo())),
  },

  {
    mutates: true,
    id: "repo.clone",
    title: "Clone Repository",
    workspace: "Repository Access",
    description: "Clone a repository locally.",
    command: "gitfleet repo clone <repo>",
    inputs: [repoInput, { key: "depth", label: "Depth", type: "number" }],

    run: ({ values }) =>
      repositoryService.clone(
        requiredText(values, "repo"),
        text(values, "depth") ? numberValue(values, "depth") : undefined,
      ),
  },

  ...[true, false].map(
    (archived): TuiOperation => ({
      mutates: true,
      workspace: "Repository Access",
      id: `repo.${archived ? "archive" : "unarchive"}`,
      title: `${archived ? "Archive" : "Unarchive"} Repository`,
      command: `gitfleet repo ${archived ? "archive" : "unarchive"} <repo>`,
      description: `${archived ? "Archive" : "Unarchive"} a repository.`,
      inputs: [repoInput],

      run: ({ values }) =>
        repositoryService.update(requiredText(values, "repo"), { archived }),
    }),
  ),

  {
    mutates: true,
    id: "repo.rename",
    title: "Rename Repository",
    workspace: "Repository Access",
    description: "Rename a repository.",
    command: "gitfleet repo rename <repo> <new-name>",

    inputs: [
      repoInput,
      { key: "newName", label: "New name", type: "string", required: true },
    ],

    run: ({ values }) =>
      repositoryService.update(requiredText(values, "repo"), {
        name: requiredText(values, "newName"),
      }),
  },

  {
    mutates: true,
    id: "repo.star",
    title: "Star Repository",
    workspace: "Repository Access",
    description: "Star a repository.",
    command: "gitfleet repo star <repo>",
    inputs: [repoInput],
    run: ({ values }) => repositoryService.star(requiredText(values, "repo")),
  },

  {
    mutates: true,
    id: "repo.unstar",
    title: "Unstar Repository",
    workspace: "Repository Access",
    command: "gitfleet repo unstar <repo>",
    description: "Remove a star from a repository.",
    inputs: [repoInput],
    run: ({ values }) => repositoryService.unstar(requiredText(values, "repo")),
  },

  {
    mutates: true,
    id: "repo.delete",
    title: "Delete Repository",
    workspace: "Repository Access",
    description: "Permanently delete a repository.",
    command: "gitfleet repo delete <repo> --yes",
    inputs: [repoInput],
    run: ({ values }) => repositoryService.remove(requiredText(values, "repo")),
  },

  {
    mutates: true,
    id: "repo.edit",
    title: "Edit Repository",
    workspace: "Repository Access",
    description: "Edit repository metadata.",
    command: "gitfleet repo edit <repo>",

    inputs: [
      repoInput,
      { key: "description", label: "Description", type: "string" },
      { key: "homepage", label: "Homepage", type: "string" },
      { key: "visibility", label: "Visibility", type: "string" },
    ],

    run: ({ values }) =>
      repositoryService.update(requiredText(values, "repo"), {
        description: text(values, "description"),
        homepage: text(values, "homepage"),

        visibility: text(values, "visibility") as
          | "public"
          | "private"
          | undefined,
      }),
  },

  {
    mutates: true,
    id: "repo.fork",
    title: "Fork Repository",
    workspace: "Repository Access",
    description: "Fork and optionally clone a repository.",
    command: "gitfleet repo fork <repo>",

    inputs: [
      repoInput,
      { key: "clone", label: "Clone", type: "boolean" },

      {
        key: "remoteName",
        label: "Remote name",
        type: "string",
        defaultValue: "origin",
      },
    ],

    run: ({ values }) =>
      repositoryService.fork(requiredText(values, "repo"), {
        clone: booleanValue(values, "clone"),
        remoteName: text(values, "remoteName"),
      }),
  },

  {
    mutates: true,
    id: "repo.sync",
    title: "Sync Repository",
    workspace: "Repository Access",
    description: "Fast-forward a branch from its upstream.",
    command: "gitfleet repo sync",
    inputs: [repoInput, { key: "branch", label: "Branch", type: "string" }],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return repositoryService.sync(repo, text(values, "branch"));
    },
  },

  {
    mutates: true,
    id: "repo.invite",
    title: "Invite Collaborator",
    workspace: "Repository Access",
    description: "Invite a collaborator to a repository.",
    command: "gitfleet repo invite --user <user> --role <role>",

    inputs: [
      repoInput,
      { key: "user", label: "User", type: "string", required: true },

      {
        key: "role",
        label: "Role",
        type: "string",
        defaultValue: "push",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      const parts = repo.split("/");

      if (parts.length !== 2) {
        throw new GitfleetError(
          "Repository must be in namespace/repository format.",
        );
      }

      return invitesService.invite(
        parts[0],
        parts[1],
        requiredText(values, "user"),
        text(values, "role") ?? "push",
      );
    },
  },

  {
    mutates: true,
    id: "repo.grant",
    workspace: "Repository Access",
    title: "Grant Team Access",
    description: "Grant team access to a repository.",
    command: "gitfleet repo grant --team <team> --role <role>",

    inputs: [
      repoInput,
      { key: "team", label: "Team", type: "string", required: true },

      {
        key: "role",
        label: "Role",
        type: "string",
        defaultValue: "push",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      const parts = repo.split("/");

      if (parts.length !== 2) {
        throw new GitfleetError(
          "Repository must be in namespace/repository format.",
        );
      }

      return invitesService.grant(
        parts[0],
        parts[1],
        requiredText(values, "team"),
        text(values, "role") ?? "push",
      );
    },
  },
];

export default repoOperations;
