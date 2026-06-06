import type { TuiOperation } from "../types";
import complianceService from "@/services/compliance";
import { targetInputs, targetOptions } from "./shared";

const complianceOperations: TuiOperation[] = [
  {
    workspace: "Security",
    id: "compliance.check",
    title: "Check Compliance",
    command: "ghg compliance check",
    description: "Score repository compliance posture.",
    inputs: [...targetInputs],
    run: ({ values }) => complianceService.check(targetOptions(values)),
  },
];

export default complianceOperations;
