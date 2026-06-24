import type { TuiOperation } from "../types";
import releaseService from "@/services/release";
import { type BumpLevel } from "@/core/conventional";

import {
  text,
  inferRepo,
  repoInput,
  booleanValue,
  requiredText,
} from "./shared";

const releaseOperations: TuiOperation[] = [
  {
    workspace: "Release",
    id: "release.changelog",
    title: "Release Changelog",
    command: "ghg release changelog",
    description: "Generate changelog from conventional commits.",

    inputs: [
      { key: "since", label: "Since tag", type: "string" },
      { key: "to", label: "To ref", type: "string", defaultValue: "HEAD" },
    ],

    run: ({ values }) =>
      releaseService.changelog({
        to: text(values, "to") ?? undefined,
        since: text(values, "since") ?? undefined,
      }),
  },

  {
    mutates: true,
    id: "release.bump",
    workspace: "Release",
    title: "Bump Version",
    command: "ghg release bump",
    description: "Auto-detect or specify the next semver bump.",

    inputs: [
      {
        key: "level",
        label: "Level",
        type: "string",
        placeholder: "major, minor, patch",
      },

      { key: "create", label: "Create tag", type: "boolean" },
      { key: "push", label: "Push tag", type: "boolean" },
    ],

    run: ({ values }) =>
      releaseService.bump({
        level: text(values, "level") as BumpLevel | undefined,
        create: booleanValue(values, "create"),
        push: booleanValue(values, "push"),
      }),
  },

  {
    title: "Verify Tag",
    id: "release.verify",
    workspace: "Release",
    command: "ghg release verify <tag>",
    description: "Verify local tag/commit GPG signatures and release assets.",

    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return releaseService.verify(requiredText(values, "tag"), { repo });
    },
  },

  {
    id: "release.notes",
    workspace: "Release",
    title: "Release Notes",
    command: "ghg release notes",
    description: "Generate release notes from a template.",

    inputs: [
      repoInput,
      { key: "template", label: "Template file", type: "string" },
      { key: "since", label: "Since tag", type: "string" },
      { key: "out", label: "Output file", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return releaseService.notes({
        out: text(values, "out") ?? undefined,
        since: text(values, "since") ?? undefined,
        templateFile: text(values, "template") ?? undefined,
        repo,
      });
    },
  },

  {
    mutates: true,
    id: "release.draft",
    workspace: "Release",
    title: "Draft Release",
    command: "ghg release draft",
    description: "Create a draft release on GitHub.",

    inputs: [
      repoInput,
      {
        key: "level",
        label: "Level",
        type: "string",
        defaultValue: "patch",
        placeholder: "major, minor, patch",
      },

      { key: "title", label: "Title", type: "string" },
      {
        key: "notes",
        label: "Notes",
        type: "string",
        defaultValue: "generated",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return releaseService.draft({
        level: (text(values, "level") as BumpLevel) ?? "patch",
        title: text(values, "title") ?? undefined,
        notes: text(values, "notes") ?? undefined,
        repo,
      });
    },
  },
];

export default releaseOperations;
