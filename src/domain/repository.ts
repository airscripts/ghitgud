import { ConfigError } from "@/core/errors";

import type { ProviderId, RepositoryRef } from "@/domain/provider";

const HOST_PROVIDERS: Readonly<Record<string, ProviderId>> = {
  "github.com": "github",
};

function parseRemoteUrl(remoteUrl: string): URL {
  const scp = remoteUrl.match(/^([^@\s]+)@([^:/\s]+):(.+)$/);
  if (scp) {
    return new URL(`ssh://${scp[1]}@${scp[2]}/${scp[3]}`);
  }

  try {
    return new URL(remoteUrl);
  } catch {
    throw new ConfigError(`Invalid git remote URL: ${remoteUrl}`);
  }
}

export function repositoryRefFromRemote(
  remoteUrl: string,
  providersByHost: Readonly<Record<string, ProviderId>> = HOST_PROVIDERS,
): RepositoryRef {
  const url = parseRemoteUrl(remoteUrl);
  const host = url.hostname.toLowerCase();
  const provider = providersByHost[host];
  if (!provider) {
    throw new ConfigError(`Unsupported git provider host: ${host}`);
  }

  const segments = url.pathname
    .replace(/^\//, "")
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);
  const name = segments.pop();
  const namespace = segments.join("/");
  if (!name || !namespace) {
    throw new ConfigError(`Invalid repository remote: ${remoteUrl}`);
  }

  return { provider, host, namespace, name };
}
