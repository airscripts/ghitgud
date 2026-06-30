#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Advisories"
expect_exit_0 "advisory list succeeds" ghg advisory list

step "List Advisories by Ecosystem"
expect_exit_0 "advisory list with ecosystem succeeds" ghg advisory list --ecosystem npm

step "View an Advisory"
expect_exit_0 "advisory view succeeds" ghg advisory view GHSA-qwxx-xxxx-xxxx || true

print_summary