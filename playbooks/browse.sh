#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "Browse Repository URL"
expect_exit_0 "browse repo succeeds" ghg browse repo --repo "$REPO" || skip "Browser not available in CI"

print_summary