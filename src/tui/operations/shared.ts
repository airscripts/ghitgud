import config from "@/core/config";
import { GhitgudError } from "@/core/errors";
import type { TuiInput, TuiInputValues } from "../types";

const repoInput: TuiInput = {
  key: "repo",
  type: "string",
  label: "Repository",
  placeholder: "owner/repo",
};

const orgInput: TuiInput = {
  key: "org",
  type: "string",
  label: "Organization",
};

const reposInput: TuiInput = {
  key: "repos",
  type: "string",
  label: "Repositories",
  placeholder: "owner/a,owner/b",
};

const fileInput: TuiInput = {
  key: "file",
  type: "string",
  label: "Repo file",
};

const limitInput: TuiInput = {
  key: "limit",
  type: "number",
  label: "Limit",
};

const targetInputs = [orgInput, reposInput, fileInput, limitInput];

const text = (values: TuiInputValues, key: string): string | undefined => {
  const value = values[key];
  if (value === undefined || value === "") return undefined;
  return String(value);
};

const requiredText = (values: TuiInputValues, key: string): string => {
  const value = text(values, key);
  if (!value) throw new GhitgudError(`Missing required input: ${key}.`);
  return value;
};

const numberValue = (values: TuiInputValues, key: string): number => {
  const value = Number(values[key]);
  if (Number.isNaN(value)) throw new GhitgudError(`Invalid number: ${key}.`);
  return value;
};

const booleanValue = (values: TuiInputValues, key: string): boolean => {
  return values[key] === true || values[key] === "true";
};

const targetOptions = (values: TuiInputValues) => ({
  org: text(values, "org"),
  file: text(values, "file"),
  repos: text(values, "repos"),
  limit: text(values, "limit"),
});

const repoValue = (values: TuiInputValues) => {
  return text(values, "repo") ?? config.getRepo();
};

export {
  text,
  orgInput,
  repoInput,
  repoValue,
  fileInput,
  reposInput,
  limitInput,
  numberValue,
  targetInputs,
  requiredText,
  booleanValue,
  targetOptions,
};
