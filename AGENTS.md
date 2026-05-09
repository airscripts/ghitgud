# AGENTS.md

## 1. Overview

ghitgud is a TypeScript CLI that manages GitHub repository labels — list, pull, push, and prune — via the GitHub REST API. Built on Node.js with Commander for the CLI framework, Consola for rich output, and `dotenv` for configuration. The codebase follows a layered architecture: CLI entry point → command modules → service modules → API client → config/constants. All output uses Consola for rich CLI output; all errors throw custom exception classes caught at the entry boundary.

---

## 2. Repository Structure

```
src/
  cli/
    index.ts        # entry point — Commander program setup and global error boundary
    ascii.ts        # figlet banner for help output
  commands/
    ping.ts          # ghitgud ping
    labels.ts        # ghitgud labels <list|pull|push|prune> + --template flag
    config.ts        # ghitgud config <get|set>
  services/
    labels.ts        # label business logic (list, pull, push, prune, template variants)
    config.ts        # config business logic (get, set)
  api/
    client.ts        # base HTTP client — auth headers, error mapping, request wrapper
    labels.ts        # GitHub Labels API methods
  core/
    constants.ts     # all shared constants (status codes, paths, error messages, config keys)
    errors.ts        # custom error class hierarchy (GhitgudError → AuthError, ConfigError, NotFoundError, UnprocessableError)
    config.ts        # config resolver — env vars first, then credentials file
    io.ts            # generic file helpers (readJsonFile, writeJsonFile, fileExists, ensureDir)
    logger.ts        # consola instance for rich CLI output
  types/
    index.ts         # shared type definitions (Label, normalizeLabel)
  env.d.ts          # global type declarations (__VERSION__)
templates/
  base.json           # minimal label template
  conventional.json   # conventional-commits label template
  github.json         # GitHub default label template
tests/
  unit/
    api/
      client.test.ts
      labels.test.ts
    cli/
      ascii.test.ts
      index.test.ts
    commands/
      config.test.ts
      labels.test.ts
      ping.test.ts
    core/
      config.test.ts
      errors.test.ts
      logger.test.ts
      io.test.ts
    services/
      config.test.ts
      labels.test.ts
tests/tsconfig.json
eslint.config.mjs          # ESLint flat config
.prettierrc.json           # Prettier config
vite.config.ts             # Vite build + Vitest test config (combined)
tsconfig.json              # TypeScript config for src/
package.json
VERSION                    # single source of truth for version
```

- New commands go in `src/commands/`. Each exports `{ register }` — a function that takes the Commander `program` and wires up subcommands.
- New service logic goes in `src/services/`. Services hold business logic and I/O. They import from `api/` and `core/`.
- New API endpoints go in `src/api/`. API modules use the shared `client.ts` — never call `fetch` directly.
- All constants live in `src/core/constants.ts`. No magic strings or numbers elsewhere.
- All custom errors live in `src/core/errors.ts`. No bare `new Error()` for domain errors.
- No `import "dotenv/config"` outside of `src/core/config.ts`. Config resolution is centralized.
- `templates/` holds JSON label presets; resolved at runtime via `__dirname` (bundled to `dist/templates/` by Vite build).
- `@/` import aliases are used throughout. Resolved by Vite at build time and by `tsconfig.json` `paths` for type checking. No `baseUrl` — paths resolve relative to their tsconfig location.

---

## 5. Commands and Workflows

```bash
# Install dependencies
pnpm install

# Build (Vite produces single CJS bundle at dist/index.js)
pnpm build

# Run locally
pnpm start        # node dist/index.js

# Test
pnpm test         # vitest (watch mode)
pnpm test -- --run # single run (no watch)

# Lint
pnpm lint          # eslint src/ tests/

# Format
pnpm format        # prettier --write .
pnpm format:check  # prettier --check .

# Type check
pnpm typecheck    # tsc --noEmit (uses tsconfig.json)

# Type check tests
npx tsc --noEmit -p tests/tsconfig.json

# Coverage
pnpm test:coverage

# Clean build artifacts
pnpm clean

# Clean local config
bash scripts/clean.sh
```

CI uses reusable GitHub Actions workflows (verify, build, test, deploy). The verify workflow runs typecheck, lint, and format checks.

---

## 6. Code Formatting

### TypeScript

**Indentation:** 2 spaces. No tabs anywhere. Enforced by Prettier.

```typescript
const register = (program: Command) => {
  program
    .command("ping")
    .description("Check if the CLI is working.")
    .action(() => void labelsService.ping());
};
```

**Line length:** `printWidth: 80` in Prettier config. Keep lines under 80 in practice.

**Blank lines — top-level:** 1 blank line between top-level definitions (functions, constants, exports).

```typescript
const ping = () => {
  const result = { success: true, message: PING_RESPONSE };
  logger.success(PING_RESPONSE);
  return result;
};

const list = async () => {
```

**Blank lines — methods:** No blank lines between methods inside an object literal export.

```typescript
export default {
  ping,
  list,
  pull,
};
```

**Blank lines — after imports:** 1 blank line after the import block, then 1 blank line between import groups (stdlib → third-party → local).

```typescript
import fs from "fs";
import path from "path";

import { Command } from "commander";

import labelsService from "@/services/labels";
import {
  GHITGUD_FOLDER,
  METADATA_FILE_PATH,
  ERROR_NO_METADATA,
  PING_RESPONSE,
} from "@/core/constants";
```

**Trailing newline:** Files end with a single newline. Enforced by Prettier.

**Trailing whitespace:** Never present. Enforced by Prettier.

**Quote style:** Double quotes for all string literals — imports, arguments, object keys, template literals. Enforced by Prettier (`singleQuote: false`).

```typescript
import fs from "fs";
const TEMPLATES_DIR = path.join(__dirname, "templates");
```

**Brace placement:** Opening brace always on the same line.

```typescript
const handleError = (status: number): never => {
  if (status === STATUS_UNAUTHORIZED) throw new AuthError("Unauthorized.");
```

**Spacing — operators:** Spaces around binary operators. No spaces inside parentheses or brackets.

```typescript
if (response.status === STATUS_OK_MIN) return response;
const result = { success: true, key, value: value || null };
```

**Spacing — colons:** No space before colon in object properties, space after. Space after colon in type annotations.

```typescript
const result = { success: true, key, value: value || null };
interface RequestOptions {
  method?: string;
  body?: unknown;
}
```

**Trailing commas:** Present on multi-line object and array literals, and on multi-line function argument lists.

```typescript
import {
  GHITGUD_FOLDER,
  METADATA_FILE_PATH,
  ENCODING,
  ERROR_NO_METADATA,
  PING_RESPONSE,
} from "@/core/constants";
```

**Semicolons:** Always present at the end of statements.

```typescript
const NAME = "ghitgud";
program.name(NAME).description(DESCRIPTION).version(__VERSION__);
```

**Export default pattern:** Each module exports a default object or function as a single `export default` at the end.

```typescript
export default { set, get };
export default client;
export default ascii;
```

---

## 7. Naming Conventions

### TypeScript

**Functions and methods:** `camelCase`. Named for their action or query.

```typescript
const ping = () => { ... }
const list = async () => { ... }
const pullTemplate = async (templateName: string, templatesDir: string) => { ... }
function buildHeaders(): Record<string, string> { ... }
function handleError(status: number): never { ... }
```

**Classes (error types):** `PascalCase` with `Error` suffix. Base class is `GhitgudError`.

```typescript
class GhitgudError extends Error { ... }
class AuthError extends GhitgudError { ... }
class ConfigError extends GhitgudError { ... }
class NotFoundError extends GhitgudError { ... }
class UnprocessableError extends GhitgudError { ... }
```

**Constants:** `SCREAMING_SNAKE_CASE` for module-level constants.

```typescript
const STATUS_OK_MIN = 200;
const GHITGUD_FOLDER = path.join(os.homedir(), ".config", "ghitgud");
const ERROR_NO_REPO =
  "You must set the GHITGUD_GITHUB_REPO environment variable.";
```

**File names:** `camelCase.ts`. Match the primary concern of the module.

```
client.ts    labels.ts    config.ts    constants.ts    errors.ts
```

**Test files:** `<module>.test.ts` under `tests/unit/<domain>/`.

```
tests/unit/core/errors.test.ts
tests/unit/services/labels.test.ts
```

**Private/local-only functions:** Still `camelCase` — no underscore prefix.

```typescript
function buildHeaders(): Record<string, string> { ... }   // not exported, but no _
```

---

## 8. Type Annotations

### TypeScript

- Public function parameters and return types are annotated. Arrow functions with obvious return types may omit the explicit return type annotation.
- Interfaces use PascalCase. Types are defined in `src/types/index.ts` or inline in the module where used.

```typescript
interface RequestOptions {
  method?: string;
  body?: unknown;
}
```

- Type casting uses `as` for narrowing:

```typescript
if (!SUPPORTED_CONFIG_KEYS.includes(key as SupportedKey)) {
```

- Tuple type inference for `const` arrays uses `(typeof ARR)[number]` for derived union types:

```typescript
export const SUPPORTED_CONFIG_KEYS = ["token", "repo"] as const;
type SupportedKey = (typeof SUPPORTED_CONFIG_KEYS)[number];
```

- `tsconfig.json` has `"strict": true`. The type checker is enforced.
- Global type-only declarations go in `src/env.d.ts` (e.g., `declare const __VERSION__: string`).

---

## 9. Imports

### TypeScript

Three groups, separated by blank lines:

1. **Stdlib** — `fs`, `path`, `process`, `os`
2. **Third-party** — `commander`, `consola`, `figlet`, `dotenv`
3. **Local** — `@/` import aliases (`@/core/constants`, `@/services/labels`, etc.)

Within each group, imports are loosely sorted — stdlib by usage order, third-party by package name, local by module path.

Side-effect imports (`import "dotenv/config"`) only appear in `src/core/config.ts`.

**Canonical example:**

```typescript
import fs from "fs";
import path from "path";

import { Command } from "commander";

import labelsService from "@/services/labels";
import logger from "@/core/logger";
import {
  GHITGUD_FOLDER,
  CREDENTIALS_FILE,
  ENCODING,
  ERROR_UNSUPPORTED_KEY,
  SUPPORTED_CONFIG_KEYS,
} from "@/core/constants";
import { ConfigError } from "@/core/errors";
```

- Named imports use `{ }` destructuring. Single-import named imports are on one line.
- Default imports use `import X from` — no `{ default as X }` syntax.
- No `import *` anywhere in the codebase.
- No `import type` keyword — regular `import` is used for both values and types.
- Sibling imports use `./` (e.g., `import ascii from "./ascii"` in `cli/index.ts`).

---

## 10. Error Handling

### TypeScript

**Custom error hierarchy** in `src/core/errors.ts`:

```typescript
class GhitgudError extends Error { ... }
class AuthError extends GhitgudError { ... }
class ConfigError extends GhitgudError { ... }
class NotFoundError extends GhitgudError { ... }
class UnprocessableError extends GhitgudError { ... }
```

**Rules:**

- All domain errors throw a custom `GhitgudError` subclass — never bare `new Error()` for business logic failures.
- `throw new Error(...)` is acceptable for truly unexpected or infrastructure failures (e.g., template not found).
- The global error boundary in `src/cli/index.ts` catches `GhitgudError` and logs via `logger.error` with exit code 1. Unknown errors re-throw. `CommanderError` with `exitCode: 0` is treated as a successful exit.
- API errors map HTTP status codes to exception types via `handleError` in `client.ts`. Unmapped status codes throw `GhitgudError`.
- Config errors (`missing token`, `missing repo`) throw `ConfigError`.
- Services do not catch errors — they throw and let the CLI boundary handle output.

**No `try/catch` in services.** The pattern is:

```typescript
// services/labels.ts
if (!io.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);

// api/client.ts
if (isSuccessful(response.status)) return response;
handleError(response.status);
```

---

## 11. Comments and Docstrings

### TypeScript

- **No doc comments** are used anywhere in the codebase. Neither JSDoc (`/** */`) nor inline doc comments appear.
- **No module-level docstrings.**
- **Inline comments** are absent from the current codebase. Code is self-documenting through descriptive naming.
- Self-documenting patterns are preferred: named constants (`STATUS_OK_MIN`, `ERROR_NO_REPO`), descriptive function names (`pullTemplate`, `handleError`), and typed parameters.
- `never` is allowed as a comment on tests and `TODO` items.

---

## 12. Testing

### Framework: Vitest 3.x

```bash
pnpm test         # run all tests (watch mode)
pnpm test -- --run # single run (no watch)
pnpm test:coverage # run with coverage
```

- Test files live in `tests/unit/` organized by domain subdirectory, not alongside source files.
- A separate `tests/tsconfig.json` extends the root config and includes both test and source files for type checking.
- File naming: `<module>.test.ts`.
- Test structure: `describe("<domain>", () => { it("<description>", ...) })`.

```typescript
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

import api from "@/api/labels";
import labelsService from "@/services/labels";

vi.mock("@/api/labels", () => ({
  default: {
    fetch: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("labels", () => {
  beforeEach(() => {
    vi.spyOn(logger, "success").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list labels", async () => {
    const mockResponse = { json: () => Promise.resolve(API_LABELS) };
    (api.fetch as Mock).mockResolvedValue(mockResponse);
    const result = await labelsService.list();
    expect(result).toEqual({ success: true, metadata: METADATA_LABELS });
  });
});
```

- `vi.mock()` is used at module scope to mock API and config modules — tests never make real HTTP calls or filesystem writes.
- `vi.spyOn()` is used for method-level mocking (e.g., `vi.spyOn(io, "fileExists").mockReturnValue(true)`).
- `vi.restoreAllMocks()` in `afterEach` to clean up between tests.
- Dynamic `import()` with `vi.resetModules()` is used when testing modules that read environment variables at import time.
- `@vitest/coverage-v8` is used for coverage reporting. Target: ≥80% statement coverage.

---

## 13. Git

> **Repo-wide:**

- **Commit prefixes** — lowercase, followed by colon and space:
  - `feat:` — new user-visible behavior
  - `fix:` — bug fix
  - `refactor:` — code restructure without behavior change
  - `chore:` — build, release, dependency, or metadata changes
  - `tests:` — test additions or modifications
  - `ci:` — CI/CD workflow changes
  - `documentation:` — documentation-only changes
  - `repo:` — project scaffolding
- **No scopes** are used — commits are not scoped to modules or services.
- **Subject line:** Imperative mood, no period, under 50 characters median (p95 under 38).
- **Body:** Never used — 0% of commits have a body.
- **GPG signing:** Not enforced.
- **Merge strategy:** Rebase. No merge commits in history.

---

## 14. Dependencies and Tooling

### TypeScript / Node.js

- **Package manager:** pnpm. `pnpm-lock.yaml` is committed. `.npmrc` has `save-exact=true`.
- **Add a dependency:** `pnpm add <package>`
- **Build tool:** Vite 8.x. `vite.config.ts` handles build (single CJS bundle to `dist/index.js` with shebang) and test config (Vitest). Node.js builtins and production deps are externalized.
- **Type checker:** `tsc --noEmit`. Config in `tsconfig.json` (for `src/`) and `tests/tsconfig.json` (for tests). Both use `"moduleResolution": "bundler"` and `"paths"` with `"@/*"` aliases — no `baseUrl` (deprecated in TS 7.0).
- **Formatter:** Prettier 3.x with `.prettierrc.json`. Config: double quotes, semicolons, trailing commas, 80-char print width, 2-space indent. Run `pnpm format` to auto-fix, `pnpm format:check` to verify.
- **Linter:** ESLint 10.x with flat config (`eslint.config.mjs`). Uses `@eslint/js` recommended, `typescript-eslint` recommended, and `eslint-config-prettier` to disable formatting rules. Run `pnpm lint` to check.
- **Build:** `pnpm build` runs `rm -rf dist && vite build && cp -r templates dist/`.
- **Runtime:** Node.js 24+. `#!/usr/bin/env node` shebang set via Vite `output.banner`.
- **Version:** Single source of truth in `VERSION` file at repo root. Inlined at build time via Vite `define` as `__VERSION__` (declared in `src/env.d.ts`).
- **Entry point:** `dist/index.js` (declared in `package.json` `bin` and `main`).
- **npm publishing:** `package.json` `files` field limits published content to `dist/`, `templates/`, and `VERSION`. `prepublishOnly` script runs typecheck, tests, and build.
- **Test config:** Combined in `vite.config.ts` using `defineConfig` from `vitest/config`. No separate `vitest.config.ts`.

---

## 15. Red Lines

**Formatting violations:**

- Never use single quotes for string literals — the codebase uses double quotes consistently. Enforced by Prettier (`singleQuote: false`).
- Never use tabs for indentation — always 2 spaces. Enforced by Prettier (`tabWidth: 2`).
- Never omit trailing commas in multi-line imports, objects, or arrays. Enforced by Prettier (`trailingComma: "all"`).
- Prettier handles all formatting — run `pnpm format` before committing. CI enforces `pnpm format:check`.

**Architectural violations:**

- Never call `fetch` directly outside `src/api/client.ts`. All HTTP requests go through the client module.
- Never define module-level constants in service or command files — move them to `src/core/constants.ts`.
- Never throw bare `new Error()` for domain failures — use the appropriate `GhitgudError` subclass from `src/core/errors.ts`.
- Never import `"dotenv/config"` outside `src/core/config.ts`. Environment variable resolution is centralized.
- Never register Commander commands in `src/cli/index.ts` — each command has its own module exporting `{ register }`.
- Never use `baseUrl` in tsconfig — `paths` resolves relative to the tsconfig file location when `baseUrl` is absent. This is TS 7.0-ready.
- Never use `tsc-alias` — Vite handles `@/` import alias resolution at build time.
- Never use `__dirname` with `import.meta.url` / `fileURLToPath` patterns in source — use `__dirname` directly (available in CJS context after Vite bundling).
- Never use `consola/core` in `src/core/logger.ts` — it has no reporters and produces no output. Use `import { createConsola } from "consola"` instead. `consola` must be in `vite.config.ts` `rollupOptions.external`.

**Style violations:**

- Never use `SCREAMING_SNAKE_CASE` for anything except module-level constants — functions and variables are `camelCase`.
- Never add JSDoc comments — the codebase has zero doc comments. Use descriptive names and typed parameters instead.
- Never use `console.info` for output — use `console.log` for stdout, `console.error` for stderr, and `console.table` for tabular label display.

**Testing violations:**

- Never make real HTTP calls in tests — mock `api/` modules with `vi.mock()`.
- Never write tests alongside source files — place them in `tests/unit/<domain>/`.
- Never use `describe` without a `it` — tests use `describe`/`it` blocks, not `test()`.
- Never forget to mock `io` module methods (e.g., `fileExists`, `readJsonFile`) when testing service functions that read files — tests must not hit the real filesystem.
- Never forget to mock `@/core/logger` when testing services that use `logger.success`, `logger.info`, etc.

**Git violations:**

- Never commit without a conventional prefix (`feat:`, `fix:`, etc.) — every commit message has one.
- Never use scopes in commit prefixes — no `feat(labels):` style.
- Never include a body in commit messages — subject only, imperative mood.
