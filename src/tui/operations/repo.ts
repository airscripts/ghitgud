import type { TuiOperation } from "../types";
import invitesService from "@/services/invites";
import { text, requiredText, repoInput } from "./shared";

const repoOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "repo.invite",
    workspace: "Repository Access",
    title: "Invite Collaborator",
    description: "Invite a collaborator to a repository.",
    command: "ghg repo invite --user \u003cuser\u003e --role \u003crole\u003e",

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

    run: ({ values }) => {
      const repo = text(values, "repo") ?? "";
      const parts = repo.split("/");

      if (parts.length !== 2) {
        throw new Error("Repository must be in owner/repo format.");
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
    command: "ghg repo grant --team \u003cteam\u003e --role \u003crole\u003e",

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

    run: ({ values }) => {
      const repo = text(values, "repo") ?? "";
      const parts = repo.split("/");

      if (parts.length !== 2) {
        throw new Error("Repository must be in owner/repo format.");
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
