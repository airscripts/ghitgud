#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Code Search Results"
expect_exit_0 "code search succeeds" ghg code search "README" --repo "$REPO"

step "Find Symbol Definitions"
expect_exit_0 "code definitions succeeds" ghg code definitions "main" --repo "$REPO"

step "Find Symbol References"
expect_exit_0 "code references succeeds" ghg code references "import" --repo "$REPO"

step "View File Contents"
expect_exit_0 "code file succeeds" ghg code file "package.json" --repo "$REPO"

step "Blame File with PR Context"
expect_exit_0 "code blame succeeds" ghg code blame "package.json" --repo "$REPO"

print_summary