export class GhitgudError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GhitgudError";
  }
}

export class AuthError extends GhitgudError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ConfigError extends GhitgudError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class NotFoundError extends GhitgudError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnprocessableError extends GhitgudError {
  constructor(message: string) {
    super(message);
    this.name = "UnprocessableError";
  }
}

export class RateLimitError extends GhitgudError {
  resetAt: Date;
  remaining: number;
  limit: number;

  constructor(
    message: string,
    resetAt: Date,
    remaining: number,
    limit: number,
  ) {
    super(message);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
    this.remaining = remaining;
    this.limit = limit;
  }
}

export class TokenRequiredError extends GhitgudError {
  scopes: string[];

  constructor(message: string, scopes: string[] = []) {
    super(message);
    this.name = "TokenRequiredError";
    this.scopes = scopes;
  }
}

export class SecretEncryptionError extends GhitgudError {
  constructor(message: string) {
    super(message);
    this.name = "SecretEncryptionError";
  }
}
