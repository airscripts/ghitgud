/** GitHub REST endpoint path helpers. */
function segment(value: string | number): string {
  return encodeURIComponent(String(value));
}

function repoPath(repo: string, ...segments: Array<string | number>): string {
  return `/repos/${repo}/${segments.map(segment).join("/")}`;
}

function repoRoot(repo: string): string {
  return `/repos/${repo}`;
}

function contentsPath(repo: string, targetPath = ""): string {
  if (!targetPath) return repoPath(repo, "contents");

  const encodedPath = targetPath
    .split("/")
    .map((part) => segment(part))
    .join("/");

  return `${repoPath(repo, "contents")}/${encodedPath}`;
}

export { contentsPath, repoPath, repoRoot, segment };
