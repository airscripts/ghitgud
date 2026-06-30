#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "Actions Usage"
expect_exit_0 "actions usage succeeds" ghg actions usage --repo "$REPO"

step "Actions Cost"
expect_exit_0 "actions cost succeeds" ghg actions cost --repo "$REPO"

step "Actions Top Spenders"
expect_exit_0 "actions top-spenders succeeds" ghg actions top-spenders --repo "$REPO" --limit 5

step "Actions Export JSON"
expect_exit_0 "actions export succeeds" ghg actions export --repo "$REPO" --format json

print_summary