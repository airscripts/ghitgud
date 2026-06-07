import type { TuiOperation } from "../types";
import teamService from "@/services/team";
import { text, requiredText } from "./shared";

const teamOperations: TuiOperation[] = [
  {
    id: "team.list",
    workspace: "Team",
    title: "List Teams",
    command: "ghg team list --org \u003corg\u003e",
    description: "List all teams in an organization.",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
    ],

    run: ({ values }) => teamService.list(requiredText(values, "org")),
  },

  {
    mutates: true,
    id: "team.create",
    workspace: "Team",
    title: "Create Team",
    description: "Create a new team.",
    command: "ghg team create --org \u003corg\u003e --name \u003cname\u003e",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
      { key: "name", label: "Name", type: "string", required: true },
      { key: "description", label: "Description", type: "string" },

      {
        key: "privacy",
        label: "Privacy",
        type: "string",
        defaultValue: "closed",
      },
    ],

    run: ({ values }) =>
      teamService.create(
        requiredText(values, "org"),
        requiredText(values, "name"),
        text(values, "description") ?? "",
        text(values, "privacy") ?? "closed",
      ),
  },

  {
    mutates: true,
    id: "team.add",
    workspace: "Team",
    title: "Add Team Member",

    command:
      "ghg team add --org \u003corg\u003e --team \u003cteam\u003e --user \u003cuser\u003e --role \u003crole\u003e",

    description: "Add a member to a team.",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
      { key: "team", label: "Team", type: "string", required: true },
      { key: "user", label: "User", type: "string", required: true },

      {
        key: "role",
        label: "Role",
        type: "string",
        defaultValue: "member",
      },
    ],

    run: ({ values }) =>
      teamService.addMember(
        requiredText(values, "org"),
        requiredText(values, "team"),
        requiredText(values, "user"),
        text(values, "role") ?? "member",
      ),
  },

  {
    mutates: true,
    id: "team.remove",
    workspace: "Team",
    title: "Remove Team Member",

    command:
      "ghg team remove --org \u003corg\u003e --team \u003cteam\u003e --user \u003cuser\u003e",

    description: "Remove a member from a team.",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
      { key: "team", label: "Team", type: "string", required: true },
      { key: "user", label: "User", type: "string", required: true },
    ],

    run: ({ values }) =>
      teamService.removeMember(
        requiredText(values, "org"),
        requiredText(values, "team"),
        requiredText(values, "user"),
      ),
  },
];

export default teamOperations;
