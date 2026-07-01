#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Code Search Results"
expect_exit_0 "code search succeeds" gitfleet code search "README" --repo "$REPO"

step "Find Symbol Definitions"
expect_exit_0 "code definitions succeeds" gitfleet code definitions "main" --repo "$REPO"

step "Find Symbol References"
expect_exit_0 "code references succeeds" gitfleet code references "import" --repo "$REPO"

step "View File Contents"
expect_exit_0 "code file succeeds" gitfleet code file "package.json" --repo "$REPO"

step "Blame File with PR Context"
expect_exit_0 "code blame succeeds" gitfleet code blame "package.json" --repo "$REPO"

print_summary