#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

REACT_ISSUE=""

setup() {
  REACT_ISSUE=$(gitfleet issue create --title "gitfleet-test-react" --body "Test issue for reactions" --repo "$REPO" --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("issue",{}).get("number",""))' 2>/dev/null || echo "")
}

teardown() {
  if [ -n "$REACT_ISSUE" ]; then
    gitfleet issue close "$REACT_ISSUE" --repo "$REPO" >/dev/null 2>&1 || true
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Reactions (empty)"
if [ -n "$REACT_ISSUE" ]; then
  expect_exit_0 "reaction list succeeds" gitfleet review reaction list --issue "$REACT_ISSUE" --repo "$REPO"
else
  skip "react list requires REACT_ISSUE"
fi

step "Add Reaction"
if [ -n "$REACT_ISSUE" ]; then
  expect_exit_0 "reaction add succeeds" gitfleet review reaction add --issue "$REACT_ISSUE" --emoji "+1" --repo "$REPO"
else
  skip "react add requires REACT_ISSUE"
fi

step "List Reactions After Add"
if [ -n "$REACT_ISSUE" ]; then
  expect_exit_0 "reaction list shows reaction" gitfleet review reaction list --issue "$REACT_ISSUE" --repo "$REPO"
else
  skip "react list requires REACT_ISSUE"
fi
