#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Templates"
expect_exit_0 "template list succeeds" ghg template list --repo "$REPO"

step "Show Template"
expect_exit_0 "template show succeeds" ghg template show "bug_report.yml" --repo "$REPO" || skip "No issue templates in repo"

print_summary