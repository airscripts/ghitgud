import { UnsupportedCapabilityError } from "@/domain/errors";
import githubProvider from "@/providers/github/provider";

import type {
  GitProvider,
  ProviderCapability,
  ProviderId,
} from "@/domain/provider";

const providers: ReadonlyMap<ProviderId, GitProvider> = new Map([
  [githubProvider.id, githubProvider],
]);

function get(provider: ProviderId): GitProvider {
  const implementation = providers.get(provider);
  if (!implementation) {
    throw new UnsupportedCapabilityError(provider, "repositories");
  }
  return implementation;
}

function requireCapability(
  provider: ProviderId,
  capability: ProviderCapability,
): GitProvider {
  const implementation = get(provider);
  if (!implementation.capabilities()[capability]) {
    throw new UnsupportedCapabilityError(provider, capability);
  }
  return implementation;
}

export default { get, requireCapability };
