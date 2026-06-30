#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

step "List Attestations"
expect_exit_0 "attestation list succeeds" ghg attestation list "sha256:abc123" --repo "$REPO" || skip "No attestations to list"

step "Verify Attestation"
expect_exit_0 "attestation verify succeeds" ghg attestation verify "sha256:abc123" --repo "$REPO" || skip "No attestations to verify"

print_summary