#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Cache Inspect"
expect_exit_0 "cache inspect succeeds" ghg cache inspect --repo "$REPO"

step "Cache Inspect Without Repo"
CI=true expect_exit_non0 "cache inspect without repo fails" ghg cache inspect