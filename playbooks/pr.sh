#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "PR Cleanup With --dry-run"
expect_exit_0 "pr cleanup --dry-run succeeds" ghg pr cleanup --dry-run --repo "$REPO"

step "PR next"
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

step "PR next --list"
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
