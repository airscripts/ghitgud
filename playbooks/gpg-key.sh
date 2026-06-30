#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List GPG Keys"
expect_exit_0 "gpg-key list succeeds" ghg gpg-key list

print_summary