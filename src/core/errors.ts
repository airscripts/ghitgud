export class GitfleetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitfleetError";
  }
}

export class AuthError extends GitfleetError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ConfigError extends GitfleetError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class NotFoundError extends GitfleetError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnprocessableError extends GitfleetError {
  constructor(message: string) {
    super(message);
    this.name = "UnprocessableError";
  }
}

export class RateLimitError extends GitfleetError {
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

export class TokenRequiredError extends GitfleetError {
  scopes: string[];

  constructor(message: string, scopes: string[] = []) {
    super(message);
    this.name = "TokenRequiredError";
    this.scopes = scopes;
  }
}

export class SecretEncryptionError extends GitfleetError {
  constructor(message: string) {
    super(message);
    this.name = "SecretEncryptionError";
  }
}
