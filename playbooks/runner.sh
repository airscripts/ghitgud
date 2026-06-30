#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Self-Hosted Runners"
expect_exit_0 "runner list succeeds" ghg runner list --repo "$REPO"

step "List Runners with Label Filter"
expect_exit_0 "runner list with label succeeds" ghg runner list --repo "$REPO" --label linux

print_summary