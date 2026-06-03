import { GhitgudError } from "@/core/errors";

function parsePositiveInt(value: string | number, label: string): number {
  const raw = String(value).trim();

  if (!/^\d+$/.test(raw)) {
    throw new GhitgudError(`Invalid ${label}: ${value}.`);
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new GhitgudError(`Invalid ${label}: ${value}.`);
  }

  return parsed;
}

export default {
  parsePositiveInt,
};

export { parsePositiveInt };
