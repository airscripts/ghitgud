import { requiredText } from "./shared";
import authService from "@/services/auth";
import type { TuiOperation } from "../types";

const authOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "auth.login",
    title: "Login",
    workspace: "Auth",
    command: "gitfleet auth login --token <token>",
    description: "Authenticate with a provider token.",

    inputs: [
      {
        key: "token",
        secret: true,
        label: "Token",
        type: "string",
        required: true,
      },

      {
        key: "profile",
        type: "string",
        required: false,
        label: "Profile",
      },
    ],

    run: ({ values }) =>
      authService.login(requiredText(values, "token"), {
        profile: values.profile as string | undefined,
      }),
  },

  {
    id: "auth.status",
    workspace: "Auth",
    title: "Auth Status",
    command: "gitfleet auth status",
    description: "Show authentication status.",
    run: () => authService.status(),
  },

  {
    id: "auth.list",
    workspace: "Auth",
    title: "List Profiles",
    command: "gitfleet auth list",
    description: "List configured profiles.",
    run: () => authService.list(),
  },

  {
    mutates: true,
    id: "auth.switch",
    workspace: "Auth",
    title: "Switch Profile",
    command: "gitfleet auth switch <name>",
    description: "Switch the active profile.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],
    run: ({ values }) => authService.switch(requiredText(values, "name")),
  },

  {
    mutates: true,
    id: "auth.detect",
    workspace: "Auth",
    title: "Detect Profile",
    command: "gitfleet auth detect",
    description: "Detect profile for current repository.",
    run: () => authService.detect(),
  },

  {
    id: "auth.token",
    workspace: "Auth",
    title: "Show Token",
    command: "gitfleet auth token",
    description: "Print the current token.",
    run: () => authService.token(false),
  },
];

export default authOperations;
