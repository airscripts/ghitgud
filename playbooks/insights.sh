#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

setup() { :; }
teardown() { print_summary; }
trap teardown EXIT
setup

step "Insights Traffic"
expect_exit_0 "insights traffic succeeds" ghg insights traffic --repo "$REPO"

step "Insights Contributors"
expect_exit_0 "insights contributors succeeds" ghg insights contributors --repo "$REPO"

step "Insights Commits"
expect_exit_0 "insights commits succeeds" ghg insights commits --repo "$REPO"

step "Insights Frequency"
expect_exit_0 "insights frequency succeeds" ghg insights frequency --repo "$REPO"

step "Insights Popularity"
expect_exit_0 "insights popularity succeeds" ghg insights popularity --repo "$REPO"

step "Insights Participation"
expect_exit_0 "insights participation succeeds" ghg insights participation --repo "$REPO"

step "Insights Traffic --json"
expect_json_field "JSON has success=true" "success" "true" ghg insights traffic --repo "$REPO"