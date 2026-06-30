import type { TuiOperation } from "../types";
import packageService from "@/services/package";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const packageOperations: TuiOperation[] = [
  {
    workspace: "Packages",
    id: "package.list",
    title: "List Packages",
    command: "ghg package list",
    description: "List packages for an org or repo.",
    inputs: [
      repoInput,
      { key: "org", label: "Organization", type: "string" },
      { key: "type", label: "Package type", type: "string" },
    ],
    run: async ({ values }) =>
      packageService.list({
        repo: text(values, "repo"),
        org: text(values, "org"),
        packageType: text(values, "type"),
      }),
  },
  {
    workspace: "Packages",
    id: "package.view",
    title: "View Package",
    command: "ghg package view <name>",
    description: "View package details.",
    inputs: [
      { key: "name", label: "Package name", type: "string", required: true },
      repoInput,
      { key: "type", label: "Package type", type: "string" },
    ],
    run: async ({ values }) =>
      packageService.view(requiredText(values, "name"), {
        repo: text(values, "repo") || (await inferRepo()),
        packageType: text(values, "type"),
      }),
  },
  {
    workspace: "Packages",
    id: "package.versions",
    title: "List Package Versions",
    command: "ghg package versions <name>",
    description: "List versions for a package.",
    inputs: [
      { key: "name", label: "Package name", type: "string", required: true },
      repoInput,
      { key: "type", label: "Package type", type: "string" },
    ],
    run: async ({ values }) =>
      packageService.versionsList(requiredText(values, "name"), {
        repo: text(values, "repo") || (await inferRepo()),
        packageType: text(values, "type"),
      }),
  },
  {
    mutates: true,
    workspace: "Packages",
    id: "package.delete",
    title: "Delete Package Version",
    command: "ghg package delete <name> --version-id <id>",
    description: "Delete a package version.",
    inputs: [
      { key: "name", label: "Package name", type: "string", required: true },
      {
        key: "versionId",
        label: "Version ID",
        type: "number",
        required: true,
      },
      repoInput,
      { key: "type", label: "Package type", type: "string" },
    ],
    run: async ({ values }) =>
      packageService.deleteVersion(
        requiredText(values, "name"),
        numberValue(values, "versionId"),
        {
          repo: text(values, "repo") || (await inferRepo()),
          packageType: text(values, "type"),
          yes: true,
        },
      ),
  },
  {
    mutates: true,
    workspace: "Packages",
    id: "package.restore",
    title: "Restore Package Version",
    command: "ghg package restore <name> --version-id <id>",
    description: "Restore a deleted package version.",
    inputs: [
      { key: "name", label: "Package name", type: "string", required: true },
      {
        key: "versionId",
        label: "Version ID",
        type: "number",
        required: true,
      },
      repoInput,
      { key: "type", label: "Package type", type: "string" },
    ],
    run: async ({ values }) =>
      packageService.restoreVersion(
        requiredText(values, "name"),
        numberValue(values, "versionId"),
        {
          repo: text(values, "repo") || (await inferRepo()),
          packageType: text(values, "type"),
        },
      ),
  },
];

export default packageOperations;
