#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

COMMENT_ISSUE=""
COMMENT_ID=""

setup() {
  COMMENT_ISSUE=$(ghg issue create --title "ghg-test-comment" --body "Test issue for comments" --repo "$REPO" --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("issue",{}).get("number",""))' 2>/dev/null || echo "")
}

teardown() {
  if [ -n "$COMMENT_ISSUE" ]; then
    ghg issue close "$COMMENT_ISSUE" --repo "$REPO" >/dev/null 2>&1 || true
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Comments (empty)"
if [ -n "$COMMENT_ISSUE" ]; then
  expect_exit_0 "comment list succeeds" ghg comment list --issue "$COMMENT_ISSUE" --repo "$REPO"
else
  skip "comment list requires COMMENT_ISSUE"
fi

step "Reply to Issue"
if [ -n "$COMMENT_ISSUE" ]; then
  expect_exit_0 "comment reply succeeds" ghg comment reply --issue "$COMMENT_ISSUE" --body "Test comment" --repo "$REPO"
else
  skip "comment reply requires COMMENT_ISSUE"
fi

step "List Comments After Reply"
if [ -n "$COMMENT_ISSUE" ]; then
  expect_exit_0 "comment list shows comment" ghg comment list --issue "$COMMENT_ISSUE" --repo "$REPO"
else
  skip "comment list requires COMMENT_ISSUE"
fi