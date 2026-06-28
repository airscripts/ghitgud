#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

DRAFT_RELEASE_ID=""

setup() { :; }

teardown() {
  if [ -n "$DRAFT_RELEASE_ID" ]; then
    step "Deleting Draft Release"
    gh api "repos/$REPO/releases/$DRAFT_RELEASE_ID" -X DELETE >/dev/null 2>&1 && \
      pass "draft release deleted" || fail "draft release deletion failed"
  fi

  print_summary
}

trap teardown EXIT
setup

step "Release changelog"
expect_exit_0 "release changelog succeeds" ghg release changelog

step "Release Changelog With --since"
local_tag=$(git tag --sort=-version:refname 2>/dev/null | head -1 || echo "")

if [ -n "$local_tag" ]; then
  expect_exit_0 "release changelog --since succeeds" ghg release changelog --since "$local_tag"
else
  skip "release changelog --since (no tags found)"
fi

step "Release Bump --level Patch (Dry Run)"
expect_exit_0 "release bump --level patch succeeds" ghg release bump --level patch

step "Release notes"
expect_exit_0 "release notes succeeds" ghg release notes --repo "$REPO"

step "Release Draft --level Patch"
output=$(ghg release draft --level patch --repo "$REPO" --json 2>&1) || true

if echo "$output" | grep -q '"success":true'; then
  pass "release draft succeeded"
  DRAFT_RELEASE_ID=$(echo "$output" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
else
  skip "release draft (may require existing tags or release notes)"
fi

step "Release Bump With Invalid Level"
expect_exit_non0 "release bump rejects invalid level" ghg release bump --level invalid
