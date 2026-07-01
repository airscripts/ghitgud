#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Merge Queue Status"
expect_exit_0 "queue status succeeds" gitfleet change queue status --repo "$REPO"
expect_exit_0 "queue list succeeds" gitfleet change queue list --repo "$REPO"
expect_exit_0 "queue history succeeds" gitfleet change queue history --repo "$REPO" --limit 10

if [ -n "${QUEUE_PR:-}" ]; then
  step "Merge Queue Mutation"
  expect_exit_0 "queue add succeeds" gitfleet change queue add "$QUEUE_PR" --repo "$REPO"
  expect_exit_0 "queue remove succeeds" gitfleet change queue remove "$QUEUE_PR" --repo "$REPO"
else
  skip "queue add/remove (set QUEUE_PR to a dedicated test PR)"
fi
