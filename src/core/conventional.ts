export type ConventionalType =
  | "feat"
  | "fix"
  | "refactor"
  | "perf"
  | "build"
  | "ci"
  | "style"
  | "docs"
  | "security"
  | "revert"
  | "chore"
  | "test";

export type BumpLevel = "major" | "minor" | "patch";

export interface ConventionalCommit {
  hash: string;
  body: string;
  subject: string;
  breaking: boolean;
  deprecated: boolean;
  scope: string | null;
  type: ConventionalType | null;
}

const CONVENTIONAL_REGEX =
  /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<subject>.+)$/;

const BREAKING_CHANGE_REGEX = /BREAKING[-\s]CHANGE:/i;
const DEPRECATED_REGEX = /(?:deprecate|deprecated)/i;

export const CONVENTIONAL_TYPES = new Set<ConventionalType>([
  "feat",
  "fix",
  "refactor",
  "perf",
  "build",
  "ci",
  "style",
  "docs",
  "security",
  "revert",
  "chore",
  "test",
]);

const isConventionalType = (value: string): value is ConventionalType =>
  CONVENTIONAL_TYPES.has(value as ConventionalType);

export function parseCommit(
  hash: string,
  subjectLine: string,
  bodyLines: string,
): ConventionalCommit {
  const match = CONVENTIONAL_REGEX.exec(subjectLine);

  if (!match || !match.groups) {
    return {
      hash,
      type: null,
      scope: null,
      subject: subjectLine,
      body: bodyLines,
      breaking: BREAKING_CHANGE_REGEX.test(bodyLines),

      deprecated:
        DEPRECATED_REGEX.test(subjectLine) || DEPRECATED_REGEX.test(bodyLines),
    };
  }

  const rawType = match.groups.type.toLowerCase();
  const type: ConventionalType | null = isConventionalType(rawType)
    ? rawType
    : null;

  const scope = match.groups.scope ?? null;
  const subject = match.groups.subject;
  const bang = !!match.groups.bang;

  const breaking =
    bang ||
    BREAKING_CHANGE_REGEX.test(bodyLines) ||
    BREAKING_CHANGE_REGEX.test(subjectLine);

  const deprecated =
    DEPRECATED_REGEX.test(subjectLine) || DEPRECATED_REGEX.test(bodyLines);

  return {
    hash,
    type,
    scope,
    subject,
    breaking,
    deprecated,
    body: bodyLines,
  };
}

export type ChangelogCategory =
  | "Added"
  | "Changed"
  | "Deprecated"
  | "Removed"
  | "Fixed"
  | "Security";

export function mapToChangelogCategory(
  commit: ConventionalCommit,
): ChangelogCategory | null {
  if (commit.breaking || commit.type === "revert") {
    return "Changed";
  }

  if (commit.deprecated) {
    return "Deprecated";
  }

  switch (commit.type) {
    case "feat":
      return "Added";

    case "fix":
      return "Fixed";

    case "refactor":
    case "perf":
    case "build":
    case "ci":
    case "style":
    case "docs":
      return "Changed";

    case "security":
      return "Security";

    case "chore":
    case "test":
    default:
      return null;
  }
}

export function groupByCategory(
  commits: ConventionalCommit[],
): Record<string, string[]> {
  const groups: Record<string, string[]> = {
    Added: [],
    Changed: [],
    Deprecated: [],
    Removed: [],
    Fixed: [],
    Security: [],
  };

  for (const commit of commits) {
    const category = mapToChangelogCategory(commit);
    if (!category) continue;

    const line = commit.scope
      ? `${commit.subject} (${commit.scope})`
      : commit.subject;

    groups[category].push(line);
  }

  return groups;
}

export function detectBumpLevel(
  commits: ConventionalCommit[],
): BumpLevel | null {
  let level: BumpLevel | null = null;

  for (const commit of commits) {
    if (commit.breaking) {
      return "major";
    }

    if (commit.type === "feat") {
      level = "minor";
    } else if (commit.type === "fix" && !level) {
      level = "patch";
    }
  }

  return level;
}

export function renderChangelog(groups: Record<string, string[]>): string {
  const lines: string[] = [];
  const categoryOrder: ChangelogCategory[] = [
    "Added",
    "Changed",
    "Deprecated",
    "Removed",
    "Fixed",
    "Security",
  ];

  for (const category of categoryOrder) {
    const items = groups[category];
    if (!items || items.length === 0) continue;

    lines.push(`### ${category}`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}
