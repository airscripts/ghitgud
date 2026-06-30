#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List CodeQL Alerts"
expect_exit_0 "codeql list succeeds" ghg codeql list --repo "$REPO"

step "List Open CodeQL Alerts"
expect_exit_0 "codeql list with state succeeds" ghg codeql list --state open --repo "$REPO"

print_summary