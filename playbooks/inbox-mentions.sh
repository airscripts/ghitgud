#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Mentions"
expect_exit_0 "mentions succeeds" gitfleet inbox mentions --repo "$REPO"

step "Mentions --json"
expect_json_field "JSON has success=true" "success" "true" gitfleet inbox mentions --repo "$REPO"
