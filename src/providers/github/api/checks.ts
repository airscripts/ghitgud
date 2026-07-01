import client from "@/providers/github/client";
import { GitfleetError } from "@/core/errors";

const toApiPath = (checkRunUrl: string): string => {
  const match = checkRunUrl.match(/^https:\/\/api\.github\.com(\/.+)$/);
  if (!match?.[1]) {
    throw new GitfleetError("Unexpected check run URL format.");
  }

  return match[1];
};

const getCheckRun = async (checkRunUrl: string): Promise<Response> => {
  return client.getTokenRequired(toApiPath(checkRunUrl));
};

const listCheckRunAnnotations = async (
  checkRunUrl: string,
): Promise<Response> => {
  return client.getTokenRequired(`${toApiPath(checkRunUrl)}/annotations`);
};

export default {
  getCheckRun,
  listCheckRunAnnotations,
};
