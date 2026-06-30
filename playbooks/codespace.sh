#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Codespaces"
expect_exit_0 "codespace list succeeds" ghg codespace list

print_summary