import type { TuiOperation } from "../types";
import attestationService from "@/services/attestation";
import { text, requiredText, repoInput, inferRepo } from "./shared";

const attestationOperations: TuiOperation[] = [
  {
    workspace: "Attestations",
    id: "attestation.list",
    title: "List Attestations",
    command: "ghg attestation list <digest>",
    description: "List attestations for an artifact digest.",
    inputs: [
      {
        key: "digest",
        label: "Subject digest",
        type: "string",
        required: true,
      },
      repoInput,
    ],
    run: async ({ values }) =>
      attestationService.list(requiredText(values, "digest"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Attestations",
    id: "attestation.verify",
    title: "Verify Attestation",
    command: "ghg attestation verify <digest>",
    description: "Verify artifact provenance for a digest.",
    inputs: [
      {
        key: "digest",
        label: "Subject digest",
        type: "string",
        required: true,
      },
      repoInput,
    ],
    run: async ({ values }) =>
      attestationService.verify(requiredText(values, "digest"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
];

export default attestationOperations;
