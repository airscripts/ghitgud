#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Packages"
expect_exit_0 "package list succeeds" ghg package list --repo "$REPO"

step "List Packages by Type"
expect_exit_0 "package list by type succeeds" ghg package list --repo "$REPO" --type npm

step "View Package"
expect_exit_0 "package view succeeds" ghg package view "test-package" --repo "$REPO" --type npm || skip "No package to view"

step "List Package Versions"
expect_exit_0 "package versions succeeds" ghg package versions "test-package" --repo "$REPO" --type npm || skip "No package versions"

print_summary