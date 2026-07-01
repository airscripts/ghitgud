#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "Actions Usage"
expect_exit_0 "actions usage succeeds" gitfleet analytics pipeline usage --repo "$REPO"

step "Actions Cost"
expect_exit_0 "actions cost succeeds" gitfleet analytics pipeline cost --repo "$REPO"

step "Actions Top Spenders"
expect_exit_0 "actions top-spenders succeeds" gitfleet analytics pipeline top-spenders --repo "$REPO" --limit 5

step "Actions Export JSON"
expect_exit_0 "actions export succeeds" gitfleet analytics pipeline export --repo "$REPO" --format json

print_summary
