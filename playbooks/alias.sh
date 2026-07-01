#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

ALIAS_NAME="ghg-test-co"
ALIAS_EXPANSION="checkout"
IMPORT_FILE="${TMPDIR}/ghg-test-aliases.txt"

setup() {
  : > "$IMPORT_FILE"
  echo "ghg-test-br=branch" >> "$IMPORT_FILE"
  echo "ghg-test-st=status" >> "$IMPORT_FILE"
  ghg alias delete "$ALIAS_NAME" >/dev/null 2>&1 || true
  ghg alias delete ghg-test-br >/dev/null 2>&1 || true
  ghg alias delete ghg-test-st >/dev/null 2>&1 || true
}

teardown() {
  ghg alias delete "$ALIAS_NAME" >/dev/null 2>&1 || true
  ghg alias delete ghg-test-br >/dev/null 2>&1 || true
  ghg alias delete ghg-test-st >/dev/null 2>&1 || true
  rm -f "$IMPORT_FILE"
  print_summary
}

trap teardown EXIT
setup

step "Set Alias"
expect_exit_0 "alias set succeeds" ghg alias set "$ALIAS_NAME" "$ALIAS_EXPANSION"

step "Set Alias JSON"
expect_json_field "JSON has success=true" "success" "true" ghg alias set "${ALIAS_NAME}-2" "$ALIAS_EXPANSION" --json --force

step "Set Alias Without Name"
expect_exit_non0 "alias set fails without name" ghg alias set "" "expansion"

step "Set Alias Without Expansion"
expect_exit_non0 "alias set fails without expansion" ghg alias set "testname" ""

step "Set Alias Duplicate Without Force"
expect_exit_non0 "alias set fails on duplicate without --force" ghg alias set "$ALIAS_NAME" "other"

step "Set Alias Duplicate With Force"
expect_exit_0 "alias set succeeds on duplicate with --force" ghg alias set "$ALIAS_NAME" "checkout" --force

step "List Aliases"
expect_exit_0 "alias list succeeds" ghg alias list

step "List Aliases JSON"
expect_json_field "JSON has success=true" "success" "true" ghg alias list --json

step "Delete Alias"
expect_exit_0 "alias delete succeeds" ghg alias delete "$ALIAS_NAME"

step "Delete Nonexistent Alias"
expect_exit_non0 "alias delete fails for nonexistent alias" ghg alias delete "nonexistent-ghg-alias"

step "Delete Alias Without Name"
expect_exit_non0 "alias delete fails without name" ghg alias delete ""

step "Import Aliases From File"
ghg alias set ghg-test-br branch >/dev/null 2>&1 || true
ghg alias delete ghg-test-br >/dev/null 2>&1 || true
expect_exit_0 "alias import succeeds from file" ghg alias import "$IMPORT_FILE"

step "Import Aliases From File JSON"
expect_json_field "JSON has imported count" "imported" "2" ghg alias import "$IMPORT_FILE" --json --force

step "Cleanup Imported Aliases"
ghg alias delete ghg-test-br >/dev/null 2>&1 || true
ghg alias delete ghg-test-st >/dev/null 2>&1 || true