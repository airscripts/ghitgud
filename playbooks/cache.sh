#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Cache List"
expect_exit_0 "cache list succeeds" ghg cache list --repo "$REPO" --limit 10
expect_json_field "cache list returns JSON" success true ghg cache list --repo "$REPO" --limit 10

step "Delete Missing Cache"
expect_exit_non0 "cache delete rejects missing key" ghg cache delete ghg-test-missing-cache --repo "$REPO" --yes

step "Cache Inspect"
expect_exit_0 "cache inspect succeeds" ghg cache inspect --repo "$REPO"

step "Cache Inspect Without Repo"
CI=true expect_exit_non0 "cache inspect without repo fails" ghg cache inspect
