#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Cache List"
expect_exit_0 "cache list succeeds" gitfleet pipeline cache list --repo "$REPO" --limit 10
expect_json_field "cache list returns JSON" success true gitfleet pipeline cache list --repo "$REPO" --limit 10

step "Delete Missing Cache"
expect_exit_non0 "cache delete rejects missing key" gitfleet pipeline cache delete gitfleet-test-missing-cache --repo "$REPO" --yes

step "Cache Inspect"
expect_exit_0 "cache inspect succeeds" gitfleet pipeline cache inspect --repo "$REPO"

step "Cache Inspect Without Repo"
CI=true expect_exit_non0 "cache inspect without repo fails" gitfleet pipeline cache inspect
