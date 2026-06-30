#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Merge Queue Status"
expect_exit_0 "queue status succeeds" ghg queue status --repo "$REPO"
expect_exit_0 "queue list succeeds" ghg queue list --repo "$REPO"
expect_exit_0 "queue history succeeds" ghg queue history --repo "$REPO" --limit 10

if [ -n "${QUEUE_PR:-}" ]; then
  step "Merge Queue Mutation"
  expect_exit_0 "queue add succeeds" ghg queue add "$QUEUE_PR" --repo "$REPO"
  expect_exit_0 "queue remove succeeds" ghg queue remove "$QUEUE_PR" --repo "$REPO"
else
  skip "queue add/remove (set QUEUE_PR to a dedicated test PR)"
fi
