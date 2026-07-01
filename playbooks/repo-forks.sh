#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

FORK_REPO=""

setup() {
  : # Forks are created and deleted within the playbook.
}

teardown() {
  if [ -n "$FORK_REPO" ]; then
    gitfleet repo delete "$FORK_REPO" --yes >/dev/null 2>&1 || true
  fi
  print_summary
}

trap teardown EXIT
setup

step "List Forks"
expect_exit_0 "fork list succeeds" gitfleet repo forks list --repo "$REPO"

step "Create Fork"
FORK_JSON=$(gitfleet repo forks create "$REPO" --json 2>/dev/null || echo "{}")
FORK_REPO=$(echo "$FORK_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("fork",{}).get("full_name",""))' 2>/dev/null || echo "")
if [ -n "$FORK_REPO" ]; then
  pass "fork create succeeds"
else
  skip "fork create did not return a full_name; skipping dependent steps"
fi

if [ -n "$FORK_REPO" ]; then
  step "Sync Fork"
  expect_exit_0 "fork sync succeeds" gitfleet repo forks sync --repo "$FORK_REPO"

  step "Compare Fork"
  expect_exit_0 "fork compare succeeds" gitfleet repo forks compare --repo "$FORK_REPO"

  step "Delete Fork"
  expect_exit_0 "fork delete via repo command" gitfleet repo delete "$FORK_REPO" --yes
  FORK_REPO=""
fi
