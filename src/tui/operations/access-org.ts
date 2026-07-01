import orgService from "@/services/org";
import type { TuiOperation } from "../types";
import { text, requiredText } from "./shared";

const orgOperations: TuiOperation[] = [
  {
    id: "org.members",
    workspace: "Organization",
    title: "List Org Members",
    command: "gitfleet org members --org <org>",
    description: "List all organization members with their roles.",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
    ],

    run: ({ values }) => orgService.list(requiredText(values, "org")),
  },

  {
    mutates: true,
    id: "org.invite",
    workspace: "Organization",
    title: "Invite Org Member",
    command: "gitfleet org invite --org <org> --user <user> --role <role>",
    description: "Add or update a user's organization membership.",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
      { key: "user", label: "User", type: "string", required: true },

      {
        key: "role",
        label: "Role",
        type: "string",
        defaultValue: "member",
      },
    ],

    run: ({ values }) =>
      orgService.add(
        requiredText(values, "org"),
        requiredText(values, "user"),
        text(values, "role") ?? "member",
      ),
  },

  {
    mutates: true,
    id: "org.remove",
    workspace: "Organization",
    title: "Remove Org Member",
    command: "gitfleet org remove --org <org> --user <user>",
    description: "Remove a user from the organization.",

    inputs: [
      { key: "org", label: "Organization", type: "string", required: true },
      { key: "user", label: "User", type: "string", required: true },
    ],

    run: ({ values }) =>
      orgService.remove(
        requiredText(values, "org"),
        requiredText(values, "user"),
      ),
  },
];

export default orgOperations;
