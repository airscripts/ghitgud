#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "List Notifications"
expect_exit_0 "notifications list succeeds" gitfleet inbox notifications list

step "List With --all"
expect_exit_0 "notifications list --all succeeds" gitfleet inbox notifications list --all

step "List With --participating"
expect_exit_0 "notifications list --participating succeeds" gitfleet inbox notifications list --participating

step "List With --repo"
expect_exit_0 "notifications list --repo succeeds" gitfleet inbox notifications list --repo "$REPO"

step "List JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet inbox notifications list --repo "$REPO"

step "Read With Invalid ID"
expect_exit_non0 "notifications read fails with invalid ID" gitfleet inbox notifications read 999999999
