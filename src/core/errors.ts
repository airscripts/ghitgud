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
