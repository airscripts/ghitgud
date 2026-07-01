import { GitfleetError } from "@/core/errors";

import type { ProviderCapability, ProviderId } from "@/domain/provider";

export class UnsupportedCapabilityError extends GitfleetError {
  readonly provider: ProviderId;
  readonly capability: ProviderCapability;

  constructor(provider: ProviderId, capability: ProviderCapability) {
    super(`Provider "${provider}" does not support ${capability}.`);
    this.name = "UnsupportedCapabilityError";
    this.provider = provider;
    this.capability = capability;
  }
}
