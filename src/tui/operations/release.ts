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
    id: "release.list",
    workspace: "Release",
    title: "List Releases",
    command: "gitfleet release list",
    description: "List repository releases.",
    inputs: [
      repoInput,
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: async ({ values }) =>
      releaseService.list({
        repo: text(values, "repo") || (await inferRepo()),
        limit: Number(values.limit ?? 30),
      }),
  },
  {
    id: "release.view",
    workspace: "Release",
    title: "View Release",
    command: "gitfleet release view <tag>",
    description: "View release details and assets.",
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
    ],
    run: async ({ values }) =>
      releaseService.view(
        requiredText(values, "tag"),
        text(values, "repo") || (await inferRepo()),
      ),
  },
  {
    id: "release.create",
    workspace: "Release",
    title: "Create Release",
    command: "gitfleet release create <tag>",
    description: "Create a provider release.",
    mutates: true,
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
      { key: "title", label: "Title", type: "string" },
      { key: "notes", label: "Notes", type: "string" },
      { key: "draft", label: "Draft", type: "boolean" },
      { key: "prerelease", label: "Prerelease", type: "boolean" },
      { key: "latest", label: "Latest", type: "boolean" },
    ],
    run: async ({ values }) =>
      releaseService.create(requiredText(values, "tag"), {
        repo: text(values, "repo") || (await inferRepo()),
        title: text(values, "title"),
        notes: text(values, "notes"),
        draft: booleanValue(values, "draft"),
        prerelease: booleanValue(values, "prerelease"),
        latest: booleanValue(values, "latest"),
      }),
  },
  {
    id: "release.edit",
    workspace: "Release",
    title: "Edit Release",
    command: "gitfleet release edit <tag>",
    description: "Edit release title or notes.",
    mutates: true,
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
      { key: "title", label: "Title", type: "string" },
      { key: "notes", label: "Notes", type: "string" },
    ],
    run: async ({ values }) =>
      releaseService.edit(requiredText(values, "tag"), {
        repo: text(values, "repo") || (await inferRepo()),
        title: text(values, "title"),
        notes: text(values, "notes"),
      }),
  },
  {
    id: "release.delete",
    workspace: "Release",
    title: "Delete Release",
    command: "gitfleet release delete <tag>",
    description: "Delete a provider release.",
    mutates: true,
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
    ],
    run: async ({ values }) =>
      releaseService.remove(
        requiredText(values, "tag"),
        text(values, "repo") || (await inferRepo()),
      ),
  },
  {
    id: "release.download",
    workspace: "Release",
    title: "Download Release Assets",
    command: "gitfleet release download <tag>",
    description: "Download matching release assets.",
    mutates: true,
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
      { key: "pattern", label: "Pattern", type: "string" },
      { key: "outputDir", label: "Output dir", type: "string" },
    ],
    run: async ({ values }) =>
      releaseService.download(requiredText(values, "tag"), {
        repo: text(values, "repo") || (await inferRepo()),
        pattern: text(values, "pattern"),
        outputDir: text(values, "outputDir"),
      }),
  },
  {
    id: "release.upload",
    workspace: "Release",
    title: "Upload Release Assets",
    command: "gitfleet release upload <tag> <files...>",
    description: "Upload comma-separated files to a release.",
    mutates: true,
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
      {
        key: "files",
        label: "Files (comma-separated)",
        type: "string",
        required: true,
      },
      { key: "clobber", label: "Replace existing", type: "boolean" },
    ],
    run: async ({ values }) =>
      releaseService.upload(
        requiredText(values, "tag"),
        requiredText(values, "files")
          .split(",")
          .map((file) => file.trim()),
        {
          repo: text(values, "repo") || (await inferRepo()),
          clobber: booleanValue(values, "clobber"),
        },
      ),
  },
  {
    id: "release.deleteAsset",
    workspace: "Release",
    title: "Delete Release Asset",
    command: "gitfleet release delete-asset <tag> <asset-name>",
    description: "Delete an asset from a release.",
    mutates: true,
    inputs: [
      repoInput,
      { key: "tag", label: "Tag", type: "string", required: true },
      { key: "asset", label: "Asset name", type: "string", required: true },
    ],
    run: async ({ values }) =>
      releaseService.deleteAsset(
        requiredText(values, "tag"),
        requiredText(values, "asset"),
        text(values, "repo") || (await inferRepo()),
      ),
  },
  {
    workspace: "Release",
    id: "release.changelog",
    title: "Release Changelog",
    command: "gitfleet release changelog",
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
    command: "gitfleet release bump",
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
    command: "gitfleet release verify <tag>",
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
    command: "gitfleet release notes",
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
    command: "gitfleet release draft",
    description: "Create a draft release on the provider.",

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
