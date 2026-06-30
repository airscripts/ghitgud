import client from "./client";

const list = (options: {
  org?: string;
  repo?: string;
  packageType?: string;
}): Promise<Response> => {
  const params = new URLSearchParams();
  if (options.packageType) params.set("package_type", options.packageType);
  const query = params.toString();

  if (options.org) {
    return client.getTokenRequired(
      `/orgs/${encodeURIComponent(options.org)}/packages${query ? `?${query}` : ""}`,
    );
  }

  if (options.repo) {
    return client.getTokenRequired(
      `/repos/${options.repo}/packages${query ? `?${query}` : ""}`,
    );
  }

  return client.getTokenRequired(`/user/packages${query ? `?${query}` : ""}`);
};

const get = (options: {
  repo: string;
  packageType: string;
  packageName: string;
}): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${options.repo}/packages/${encodeURIComponent(options.packageType)}/${encodeURIComponent(options.packageName)}`,
  );

const versions = (options: {
  repo: string;
  packageType: string;
  packageName: string;
}): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${options.repo}/packages/${encodeURIComponent(options.packageType)}/${encodeURIComponent(options.packageName)}/versions`,
  );

const deleteVersion = (options: {
  repo: string;
  packageType: string;
  packageName: string;
  versionId: number;
}): Promise<Response> =>
  client.deleteTokenRequired(
    `/repos/${options.repo}/packages/${encodeURIComponent(options.packageType)}/${encodeURIComponent(options.packageName)}/versions/${options.versionId}`,
  );

const restoreVersion = (options: {
  repo: string;
  packageType: string;
  packageName: string;
  versionId: number;
}): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${options.repo}/packages/${encodeURIComponent(options.packageType)}/${encodeURIComponent(options.packageName)}/versions/${options.versionId}/restore`,
    {},
  );

export default { list, get, versions, deleteVersion, restoreVersion };
