#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

WS_NAME="gitfleet-test-workspace"

setup() {
  : # Workspace is defined and removed within the playbook.
}

teardown() {
  gitfleet workspace list >/dev/null 2>&1 || true
  print_summary
}

trap teardown EXIT
setup

step "Define Workspace"
expect_exit_0 "workspace define succeeds" gitfleet workspace define --name "$WS_NAME" --repos "$REPO"

step "List Workspaces"
expect_exit_0 "workspace list succeeds" gitfleet workspace list

step "Run Command in Workspace"
expect_exit_0 "workspace run succeeds" gitfleet workspace run --name "$WS_NAME" --command "repo view"
