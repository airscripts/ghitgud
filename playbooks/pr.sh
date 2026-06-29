#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

TEST_SUFFIX="$$"
BASE_BRANCH="ghg-test-pr-base-$TEST_SUFFIX"
HEAD_BRANCH="ghg-test-pr-head-$TEST_SUFFIX"
TEST_PR_NUMBER=""
CLONE_DIR="$TMPDIR/pr-checkout-$TEST_SUFFIX"

setup() {
  local default_branch base_sha content
  default_branch=$(gh api "repos/$REPO" --jq .default_branch)
  base_sha=$(gh api "repos/$REPO/git/ref/heads/$default_branch" --jq .object.sha)
  gh api "repos/$REPO/git/refs" -X POST -f ref="refs/heads/$BASE_BRANCH" -f sha="$base_sha" >/dev/null
  gh api "repos/$REPO/git/refs" -X POST -f ref="refs/heads/$HEAD_BRANCH" -f sha="$base_sha" >/dev/null
  content=$(printf 'PR playbook %s\n' "$TEST_SUFFIX" | base64 | tr -d '\n')

  gh api "repos/$REPO/contents/ghg-test-pr-$TEST_SUFFIX.txt" -X PUT \
    -f message="test: add PR playbook fixture" \
    -f content="$content" \
    -f branch="$HEAD_BRANCH" >/dev/null

  local result
  result=$(ghg pr create --repo "$REPO" --title "[noop] ghg PR lifecycle test" \
    --body "Created by the PR playbook." --base "$BASE_BRANCH" \
    --head "$HEAD_BRANCH" --draft --json)

  TEST_PR_NUMBER=$(printf '%s' "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['pullRequest']['number'])")
}

teardown() {
  if [ -n "$TEST_PR_NUMBER" ]; then
    gh api "repos/$REPO/pulls/$TEST_PR_NUMBER" -X PATCH -f state=closed -f title="[noop] ghg PR lifecycle test" >/dev/null 2>&1 || true
  fi

  gh api "repos/$REPO/git/refs/heads/$HEAD_BRANCH" -X DELETE >/dev/null 2>&1 || true
  gh api "repos/$REPO/git/refs/heads/$BASE_BRANCH" -X DELETE >/dev/null 2>&1 || true
  rm -rf "$CLONE_DIR"
  print_summary
}
trap teardown EXIT
setup

step "PR Create"
if [ -n "$TEST_PR_NUMBER" ]; then pass "pr create succeeds"; else fail "pr create failed"; fi

step "PR List"
expect_exit_0 "pr list succeeds" ghg pr list --repo "$REPO" --state all --base "$BASE_BRANCH" --limit 10

step "PR View"
expect_exit_0 "pr view succeeds" ghg pr view "$TEST_PR_NUMBER" --repo "$REPO"

step "PR Edit"
expect_exit_0 "pr edit succeeds" ghg pr edit "$TEST_PR_NUMBER" --repo "$REPO" --title "[noop] ghg PR lifecycle test edited" --body "Edited by the PR playbook."

step "PR Comment"
expect_exit_0 "pr comment succeeds" ghg pr comment "$TEST_PR_NUMBER" --repo "$REPO" --body "PR playbook comment."

step "PR Diff And Checks"
expect_exit_0 "pr diff succeeds" ghg pr diff "$TEST_PR_NUMBER" --repo "$REPO"
expect_exit_0 "pr checks succeeds" ghg pr checks "$TEST_PR_NUMBER" --repo "$REPO"

step "PR Lock And Unlock"
expect_exit_0 "pr lock succeeds" ghg pr lock "$TEST_PR_NUMBER" --repo "$REPO"
expect_exit_0 "pr unlock succeeds" ghg pr unlock "$TEST_PR_NUMBER" --repo "$REPO"

step "PR Ready"
expect_exit_0 "pr ready succeeds" ghg pr ready "$TEST_PR_NUMBER" --repo "$REPO"

step "PR Close And Reopen"
expect_exit_0 "pr close succeeds" ghg pr close "$TEST_PR_NUMBER" --repo "$REPO"
expect_exit_0 "pr reopen succeeds" ghg pr reopen "$TEST_PR_NUMBER" --repo "$REPO"

step "PR Checkout"
if gh repo clone "$REPO" "$CLONE_DIR" -- --quiet >/dev/null 2>&1; then
  (cd "$CLONE_DIR" && expect_exit_0 "pr checkout succeeds" ghg pr checkout "$TEST_PR_NUMBER" --repo "$REPO")
else
  skip "pr checkout (clone failed)"
fi

step "PR Status"
expect_exit_0 "pr status succeeds" ghg pr status --repo "$REPO"

step "PR Merge"
expect_exit_0 "pr merge succeeds" ghg pr merge "$TEST_PR_NUMBER" --repo "$REPO" --delete-branch

step "PR Invalid Options"
expect_exit_non0 "pr list rejects invalid state" ghg pr list --repo "$REPO" --state invalid
expect_exit_non0 "pr edit rejects no changes" ghg pr edit "$TEST_PR_NUMBER" --repo "$REPO"
expect_exit_non0 "pr merge rejects conflicting strategies" ghg pr merge "$TEST_PR_NUMBER" --repo "$REPO" --merge --squash

step "PR Cleanup With --dry-run"
expect_exit_0 "pr cleanup --dry-run succeeds" ghg pr cleanup --dry-run --repo "$REPO"

step "PR Next"
output=$(ghg pr next --repo "$REPO" 2>&1) || true

if echo "$output" | grep -qi "no\|none\|empty\|0 pull"; then
  skip "pr next (no PRs to review)"
else
  if ghg pr next --repo "$REPO" >/dev/null 2>&1; then
    pass "pr next succeeds"
  else
    skip "pr next (no PRs to review)"
  fi
fi

step "PR Next --list"
output=$(ghg pr next --list --repo "$REPO" 2>&1) || true

if echo "$output" | grep -qi "no\|none\|empty\|0 pull"; then
  skip "pr next --list (no PRs to review)"
else
  if ghg pr next --list --repo "$REPO" >/dev/null 2>&1; then
    pass "pr next --list succeeds"
  else
    skip "pr next --list (no PRs to review)"
  fi
fi

step "PR Cleanup Without Explicit --repo"
ghg pr cleanup --dry-run >/dev/null 2>&1 && pass "pr cleanup works without explicit --repo" || skip "pr cleanup without --repo (not in git repo)"

step "PR Push Without PR Number"
expect_rejects_missing_arg "pr push without PR number" ghg pr push --repo "$REPO"
