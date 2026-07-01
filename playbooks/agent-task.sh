#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() {
  :
}

teardown() {
  print_summary
}

trap teardown EXIT
setup

step "[noop] List Agent Tasks"
expect_exit_0 "agent-task list succeeds" ghg agent-task list

step "[noop] List Agent Tasks JSON"
expect_json_field "JSON has success=true" "success" "true" ghg agent-task list --json

step "[noop] List Agent Tasks With Repo"
expect_exit_0 "agent-task list with repo succeeds" ghg agent-task list --repo "$REPO"

step "[noop] Create Agent Task"
expect_exit_0 "agent-task create succeeds" ghg agent-task create "ghg-test task"

step "[noop] Create Agent Task JSON"
expect_json_field "JSON has success=true" "success" "true" ghg agent-task create "ghg-test task 2" --json