#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "List Projects"
expect_exit_0 "project list succeeds" ghg project list --owner "$ORG" --limit 10

step "Project Board (May Need PROJECT_ID)"
if [ -n "${PROJECT_ID:-}" ]; then
  expect_exit_0 "project board succeeds" ghg project board "$PROJECT_ID" --owner "$ORG"
else
  skip "project board (set PROJECT_ID env var to test)"
fi

step "Project Board Without ID"
expect_exit_non0 "project board without ID fails" ghg project board --owner "$ORG"
