import type { TuiOperation } from "../types";
import advisoryService from "@/services/advisory";
import { text, requiredText, repoInput, inferRepo } from "./shared";

const advisoryOperations: TuiOperation[] = [
  {
    workspace: "Advisories",
    id: "advisory.list",
    title: "List Advisories",
    command: "gitfleet advisory list",
    description: "List security advisories from the GitHub Advisory Database.",
    inputs: [
      repoInput,
      { key: "ecosystem", label: "Ecosystem", type: "string" },
      { key: "severity", label: "Severity", type: "string" },
      { key: "state", label: "State", type: "string" },
    ],
    run: async ({ values }) =>
      advisoryService.list({
        repo: text(values, "repo") || undefined,
        ecosystem: text(values, "ecosystem"),
        severity: text(values, "severity"),
        state: text(values, "state"),
      }),
  },
  {
    workspace: "Advisories",
    id: "advisory.view",
    title: "View Advisory",
    command: "gitfleet advisory view <ghsa-id>",
    description: "View a specific security advisory.",
    inputs: [
      { key: "ghsaId", label: "GHSA ID", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      advisoryService.view(requiredText(values, "ghsaId"), {
        repo: text(values, "repo") || undefined,
      }),
  },
  {
    mutates: true,
    workspace: "Advisories",
    id: "advisory.create",
    title: "Create Advisory",
    command: "gitfleet advisory create --repo <repo> --summary <text>",
    description: "Create a repository security advisory.",
    inputs: [
      { key: "repo", label: "Repository", type: "string", required: true },
      { key: "summary", label: "Summary", type: "string", required: true },
      {
        key: "description",
        label: "Description",
        type: "string",
        required: true,
      },
      {
        key: "severity",
        label: "Severity (low, medium, high, critical)",
        type: "string",
        required: true,
      },
      { key: "cveId", label: "CVE ID", type: "string" },
    ],
    run: async ({ values }) =>
      advisoryService.create({
        repo: requiredText(values, "repo"),
        summary: requiredText(values, "summary"),
        description: requiredText(values, "description"),
        severity: requiredText(values, "severity"),
        cveId: text(values, "cveId"),
      }),
  },
  {
    mutates: true,
    workspace: "Advisories",
    id: "advisory.publish",
    title: "Publish Advisory",
    command: "gitfleet advisory publish <ghsa-id>",
    description: "Publish a draft security advisory.",
    inputs: [
      { key: "ghsaId", label: "GHSA ID", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      advisoryService.publish(requiredText(values, "ghsaId"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    mutates: true,
    workspace: "Advisories",
    id: "advisory.close",
    title: "Close Advisory",
    command: "gitfleet advisory close <ghsa-id>",
    description: "Close a security advisory.",
    inputs: [
      { key: "ghsaId", label: "GHSA ID", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      advisoryService.close(requiredText(values, "ghsaId"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    mutates: true,
    workspace: "Advisories",
    id: "advisory.cve-request",
    title: "Request CVE",
    command: "gitfleet advisory cve-request <ghsa-id>",
    description: "Request a CVE for a published advisory.",
    inputs: [
      { key: "ghsaId", label: "GHSA ID", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      advisoryService.cveRequest(requiredText(values, "ghsaId"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
];

export default advisoryOperations;
