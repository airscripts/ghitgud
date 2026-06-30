#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Global Advisories"
expect_exit_0 "advisory list succeeds" ghg advisory list

step "List Advisories with Ecosystem Filter"
expect_exit_0 "advisory list with filter succeeds" ghg advisory list --ecosystem npm

step "List Repo-Scoped Advisories"
expect_exit_0 "advisory list repo succeeds" ghg advisory list --repo "$REPO" --state published

step "View an Advisory"
expect_exit_0 "advisory view succeeds" ghg advisory view GHSA-qwxv-j2rp-h2rr || skip "Advisory not found"

print_summary