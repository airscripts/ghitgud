import type { TuiOperation } from "../types";
import profileService from "@/services/profile";
import { repoInput, text, requiredText } from "./shared";

const profileOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "profile.add",
    title: "Add Profile",
    workspace: "Profile",
    command: "ghg profile add <name>",
    description: "Add or update a profile.",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },
      repoInput,
      {
        key: "token",
        secret: true,
        label: "Token",
        type: "string",
        required: true,
      },
    ],

    run: ({ values }) =>
      profileService.add(requiredText(values, "name"), {
        repo: text(values, "repo"),
        token: requiredText(values, "token"),
      }),
  },

  {
    id: "profile.list",
    workspace: "Profile",
    title: "List Profiles",
    command: "ghg profile list",
    description: "List configured profiles.",
    run: () => profileService.list(),
  },

  {
    mutates: true,
    id: "profile.switch",
    workspace: "Profile",
    title: "Switch Profile",
    command: "ghg profile switch <name>",
    description: "Switch the active profile.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],
    run: ({ values }) => profileService.switch(requiredText(values, "name")),
  },

  {
    mutates: true,
    id: "profile.detect",
    workspace: "Profile",
    title: "Detect Profile",
    command: "ghg profile detect",
    description: "Detect profile for current repository.",
    run: () => profileService.detect(),
  },
];

export default profileOperations;
