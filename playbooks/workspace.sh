#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

WS_NAME="ghg-test-workspace"

setup() {
  : # Workspace is defined and removed within the playbook.
}

teardown() {
  ghg workspace list >/dev/null 2>&1 || true
  print_summary
}

trap teardown EXIT
setup

step "Define Workspace"
expect_exit_0 "workspace define succeeds" ghg workspace define --name "$WS_NAME" --repos "$REPO"

step "List Workspaces"
expect_exit_0 "workspace list succeeds" ghg workspace list

step "Run Command in Workspace"
expect_exit_0 "workspace run succeeds" ghg workspace run --name "$WS_NAME" --command "ping"