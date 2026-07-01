import type { TuiOperation } from "../types";
import {
  text,
  inferRepo,
  repoInput,
  numberValue,
  requiredText,
} from "./shared";
import projectService from "@/services/project";

const projectOperations: TuiOperation[] = [
  {
    id: "project.board",
    workspace: "Projects",
    title: "Project Board",
    command: "gitfleet project board <id>",
    description: "Render a provider planning v2 kanban board.",

    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
    ],

    run: ({ values }) =>
      projectService.board(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
      }),
  },
  {
    id: "project.list",
    workspace: "Projects",
    title: "List Projects",
    command: "gitfleet project list",
    description: "List Projects v2.",
    inputs: [
      { key: "owner", label: "Owner", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: ({ values }) =>
      projectService.list({
        owner: text(values, "owner"),
        limit: numberValue(values, "limit"),
      }),
  },
  {
    id: "project.view",
    workspace: "Projects",
    title: "View Project",
    command: "gitfleet project view <id>",
    description: "View a Project v2.",
    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
    ],
    run: ({ values }) =>
      projectService.view(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
      }),
  },
  ...[
    { id: "create", title: "Create Project" },
    { id: "edit", title: "Edit Project" },
  ].map(
    ({ id, title }): TuiOperation => ({
      id: `project.${id}`,
      workspace: "Projects",
      title,
      command: `gitfleet project ${id}`,
      description: `${title}.`,
      mutates: true,
      inputs: [
        ...(id === "edit"
          ? ([
              {
                key: "id",
                label: "Project number",
                type: "number",
                required: true,
              },
            ] as const)
          : []),
        { key: "title", label: "Title", type: "string", required: true },
        ...(id === "edit"
          ? ([
              {
                key: "description",
                label: "Description",
                type: "string",
                required: true,
              },
            ] as const)
          : []),
        { key: "owner", label: "Owner", type: "string" },
      ],
      run: ({ values }) =>
        id === "create"
          ? projectService.create(requiredText(values, "title"), {
              owner: text(values, "owner"),
            })
          : projectService.edit(String(numberValue(values, "id")), {
              owner: text(values, "owner"),
              title: requiredText(values, "title"),
              description: requiredText(values, "description"),
            }),
    }),
  ),
  ...[
    { id: "close", title: "Close Project" },
    { id: "delete", title: "Delete Project" },
  ].map(
    ({ id, title }): TuiOperation => ({
      id: `project.${id}`,
      workspace: "Projects",
      title,
      command: `gitfleet project ${id} <id>`,
      description: `${title}.`,
      mutates: true,
      inputs: [
        { key: "id", label: "Project number", type: "number", required: true },
        { key: "owner", label: "Owner", type: "string" },
      ],
      run: ({ values }) =>
        projectService[id === "delete" ? "remove" : "close"](
          String(numberValue(values, "id")),
          { owner: text(values, "owner") },
        ),
    }),
  ),
  {
    id: "project.itemList",
    workspace: "Projects",
    title: "List Project Items",
    command: "gitfleet project item-list <id>",
    description: "List Project v2 items.",
    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: ({ values }) =>
      projectService.itemList(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
        limit: numberValue(values, "limit"),
      }),
  },
  {
    id: "project.itemAdd",
    workspace: "Projects",
    title: "Add Project Issue",
    command: "gitfleet project item-add <id>",
    description: "Add an issue to a Project v2.",
    mutates: true,
    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      repoInput,
      { key: "issue", label: "Issue number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
    ],
    run: async ({ values }) =>
      projectService.itemAdd(
        String(numberValue(values, "id")),
        numberValue(values, "issue"),
        {
          owner: text(values, "owner"),
          repo: text(values, "repo") || (await inferRepo()),
        },
      ),
  },
  {
    id: "project.itemCreate",
    workspace: "Projects",
    title: "Create Project Draft Issue",
    command: "gitfleet project item-create <id>",
    description: "Create a draft issue in a Project v2.",
    mutates: true,
    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
      { key: "owner", label: "Owner", type: "string" },
    ],
    run: ({ values }) =>
      projectService.itemCreate(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
        title: requiredText(values, "title"),
        body: text(values, "body"),
      }),
  },
  {
    id: "project.fieldList",
    workspace: "Projects",
    title: "List Project Fields",
    command: "gitfleet project field-list <id>",
    description: "List Project v2 fields.",
    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
    ],
    run: ({ values }) =>
      projectService.fieldList(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
      }),
  },
  ...[true, false].map(
    (linked): TuiOperation => ({
      id: `project.${linked ? "link" : "unlink"}`,
      workspace: "Projects",
      title: `${linked ? "Link" : "Unlink"} Project Repository`,
      command: `gitfleet project ${linked ? "link" : "unlink"} <id>`,
      description: `${linked ? "Link" : "Unlink"} a repository and project.`,
      mutates: true,
      inputs: [
        { key: "id", label: "Project number", type: "number", required: true },
        repoInput,
        { key: "owner", label: "Owner", type: "string" },
      ],
      run: ({ values }) => {
        const repo = requiredText(values, "repo");
        return projectService.setLinked(
          String(numberValue(values, "id")),
          repo,
          { owner: text(values, "owner") },
          linked,
        );
      },
    }),
  ),
];

export default projectOperations;
