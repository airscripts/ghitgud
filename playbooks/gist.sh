#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

GIST_FILE="$TMPDIR/ghg-test-gist.txt"
GIST_ID=""

setup() {
  echo "ghg gist playbook" > "$GIST_FILE"
}

teardown() {
  if [ -n "$GIST_ID" ]; then
    ghg gist delete "$GIST_ID" --yes >/dev/null 2>&1 || true
  fi
  rm -f "$GIST_FILE"
  print_summary
}

trap teardown EXIT
setup

step "List Gists"
expect_exit_0 "gist list succeeds" ghg gist list --limit 5

step "Create Gist"
CREATE_JSON=$(ghg gist create "$GIST_FILE" --description "ghg-test-gist" --json)
GIST_ID=$(echo "$CREATE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["gist"]["id"])')
if [ -n "$GIST_ID" ]; then
  pass "gist create succeeds"
else
  fail "gist create did not return an id"
fi

step "View Gist"
expect_exit_0 "gist view succeeds" ghg gist view "$GIST_ID"
expect_output "gist raw view returns content" "ghg gist playbook" ghg gist view "$GIST_ID" --raw

step "Edit Gist"
echo "updated gist" > "$GIST_FILE"
expect_exit_0 "gist edit succeeds" ghg gist edit "$GIST_ID" --add "$GIST_FILE"

step "Clone Gist"
CLONE_DIR="$TMPDIR/ghg-test-gist-clone"
rm -rf "$CLONE_DIR"
expect_exit_0 "gist clone succeeds" ghg gist clone "$GIST_ID" --dir "$CLONE_DIR"
rm -rf "$CLONE_DIR"

step "Delete Gist"
expect_exit_0 "gist delete succeeds" ghg gist delete "$GIST_ID" --yes
GIST_ID=""

step "View Missing Gist"
expect_exit_non0 "gist view rejects missing gist" ghg gist view ghg-test-missing
