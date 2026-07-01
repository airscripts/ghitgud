#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

ALIAS_NAME="gitfleet-test-co"
ALIAS_EXPANSION="checkout"
IMPORT_FILE="${TMPDIR}/gitfleet-test-aliases.txt"

setup() {
  : > "$IMPORT_FILE"
  echo "gitfleet-test-br=branch" >> "$IMPORT_FILE"
  echo "gitfleet-test-st=status" >> "$IMPORT_FILE"
  gitfleet alias delete "$ALIAS_NAME" >/dev/null 2>&1 || true
  gitfleet alias delete gitfleet-test-br >/dev/null 2>&1 || true
  gitfleet alias delete gitfleet-test-st >/dev/null 2>&1 || true
}

teardown() {
  gitfleet alias delete "$ALIAS_NAME" >/dev/null 2>&1 || true
  gitfleet alias delete gitfleet-test-br >/dev/null 2>&1 || true
  gitfleet alias delete gitfleet-test-st >/dev/null 2>&1 || true
  rm -f "$IMPORT_FILE"
  print_summary
}

trap teardown EXIT
setup

step "Set Alias"
expect_exit_0 "alias set succeeds" gitfleet alias set "$ALIAS_NAME" "$ALIAS_EXPANSION"

step "Set Alias JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet alias set "${ALIAS_NAME}-2" "$ALIAS_EXPANSION" --json --force

step "Set Alias Without Name"
expect_exit_non0 "alias set fails without name" gitfleet alias set "" "expansion"

step "Set Alias Without Expansion"
expect_exit_non0 "alias set fails without expansion" gitfleet alias set "testname" ""

step "Set Alias Duplicate Without Force"
expect_exit_non0 "alias set fails on duplicate without --force" gitfleet alias set "$ALIAS_NAME" "other"

step "Set Alias Duplicate With Force"
expect_exit_0 "alias set succeeds on duplicate with --force" gitfleet alias set "$ALIAS_NAME" "checkout" --force

step "List Aliases"
expect_exit_0 "alias list succeeds" gitfleet alias list

step "List Aliases JSON"
expect_json_field "JSON has success=true" "success" "true" gitfleet alias list --json

step "Delete Alias"
expect_exit_0 "alias delete succeeds" gitfleet alias delete "$ALIAS_NAME"

step "Delete Nonexistent Alias"
expect_exit_non0 "alias delete fails for nonexistent alias" gitfleet alias delete "nonexistent-gitfleet-alias"

step "Delete Alias Without Name"
expect_exit_non0 "alias delete fails without name" gitfleet alias delete ""

step "Import Aliases From File"
gitfleet alias set gitfleet-test-br branch >/dev/null 2>&1 || true
gitfleet alias delete gitfleet-test-br >/dev/null 2>&1 || true
expect_exit_0 "alias import succeeds from file" gitfleet alias import "$IMPORT_FILE"

step "Import Aliases From File JSON"
expect_json_field "JSON has imported count" "imported" "2" gitfleet alias import "$IMPORT_FILE" --json --force

step "Cleanup Imported Aliases"
gitfleet alias delete gitfleet-test-br >/dev/null 2>&1 || true
gitfleet alias delete gitfleet-test-st >/dev/null 2>&1 || true