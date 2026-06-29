#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

# Config no longer manages token (moved to auth).
# This playbook verifies that config set/get/unset reject unsupported keys.

step "Config Set Rejects Unsupported Key"
expect_exit_non0 "config set rejects unsupported key" ghg config set unsupported_key value

step "Config Get Rejects Unsupported Key"
expect_exit_non0 "config get rejects unsupported key" ghg config get unsupported_key

step "Config Unset Rejects Unsupported Key"
expect_exit_non0 "config unset rejects unsupported key" ghg config unset unsupported_key

print_summary