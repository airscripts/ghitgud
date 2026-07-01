#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Dependencies"
expect_exit_0 "deps list succeeds" gitfleet deps list --repo "$REPO"

step "List Direct Dependencies"
expect_exit_0 "deps direct succeeds" gitfleet deps direct --repo "$REPO"

step "Dependency Review"
expect_exit_0 "deps review succeeds" gitfleet deps review --base main --head HEAD --repo "$REPO"

print_summary