#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Insights Traffic"
expect_exit_0 "insights traffic succeeds" gitfleet analytics repo traffic --repo "$REPO"

step "Insights Contributors"
expect_exit_0 "insights contributors succeeds" gitfleet analytics repo contributors --repo "$REPO"

step "Insights Commits"
expect_exit_0 "insights commits succeeds" gitfleet analytics repo commits --repo "$REPO"

step "Insights Frequency"
expect_exit_0 "insights frequency succeeds" gitfleet analytics repo frequency --repo "$REPO"

step "Insights Popularity"
expect_exit_0 "insights popularity succeeds" gitfleet analytics repo popularity --repo "$REPO"

step "Insights Participation"
expect_exit_0 "insights participation succeeds" gitfleet analytics repo participation --repo "$REPO"

step "Insights Traffic --json"
expect_json_field "JSON has success=true" "success" "true" gitfleet analytics repo traffic --repo "$REPO"
