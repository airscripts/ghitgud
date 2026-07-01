#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

GIST_FILE="$TMPDIR/gitfleet-test-gist.txt"
GIST_ID=""

setup() {
  echo "gitfleet snippet playbook" > "$GIST_FILE"
}

teardown() {
  if [ -n "$GIST_ID" ]; then
    gitfleet snippet delete "$GIST_ID" --yes >/dev/null 2>&1 || true
  fi
  rm -f "$GIST_FILE"
  print_summary
}

trap teardown EXIT
setup

step "List Gists"
expect_exit_0 "gist list succeeds" gitfleet snippet list --limit 5

step "Create Gist"
CREATE_JSON=$(gitfleet snippet create "$GIST_FILE" --description "gitfleet-test-gist" --json)
GIST_ID=$(echo "$CREATE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["gist"]["id"])')
if [ -n "$GIST_ID" ]; then
  pass "gist create succeeds"
else
  fail "gist create did not return an id"
fi

step "View Gist"
expect_exit_0 "gist view succeeds" gitfleet snippet view "$GIST_ID"
expect_output "gist raw view returns content" "gitfleet snippet playbook" gitfleet snippet view "$GIST_ID" --raw

step "Edit Gist"
echo "updated gist" > "$GIST_FILE"
expect_exit_0 "gist edit succeeds" gitfleet snippet edit "$GIST_ID" --add "$GIST_FILE"

step "Clone Gist"
CLONE_DIR="$TMPDIR/gitfleet-test-gist-clone"
rm -rf "$CLONE_DIR"
expect_exit_0 "gist clone succeeds" gitfleet snippet clone "$GIST_ID" --dir "$CLONE_DIR"
rm -rf "$CLONE_DIR"

step "Star Gist"
expect_exit_0 "gist star succeeds" gitfleet snippet star "$GIST_ID"

step "Unstar Gist"
expect_exit_0 "gist unstar succeeds" gitfleet snippet unstar "$GIST_ID"

step "Comment on Gist"
expect_exit_0 "gist comment succeeds" gitfleet snippet comment "$GIST_ID" --body "Test comment"

step "Delete Gist"
expect_exit_0 "gist delete succeeds" gitfleet snippet delete "$GIST_ID" --yes
GIST_ID=""

step "View Missing Gist"
expect_exit_non0 "gist view rejects missing gist" gitfleet snippet view gitfleet-test-missing
