#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Global Advisories"
expect_exit_0 "advisory list succeeds" gitfleet advisory list

step "List Advisories with Ecosystem Filter"
expect_exit_0 "advisory list with filter succeeds" gitfleet advisory list --ecosystem npm

step "List Repo-Scoped Advisories"
expect_exit_0 "advisory list repo succeeds" gitfleet advisory list --repo "$REPO" --state published

step "View an Advisory"
expect_exit_0 "advisory view succeeds" gitfleet advisory view GHSA-qwxv-j2rp-h2rr || skip "Advisory not found"

print_summary