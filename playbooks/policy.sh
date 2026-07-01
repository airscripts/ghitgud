#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

RULESET_FILE="$TMPDIR/gitfleet-test-ruleset.yml"
RULESET_ID=""

setup() {
  cat > "$RULESET_FILE" <<'EOF'
name: gitfleet-test-ruleset
target: branch
enforcement: disabled
conditions:
  ref_name:
    include: ["refs/heads/gitfleet-test-*"]
    exclude: []
rules: []
EOF
}

teardown() {
  if [ -n "$RULESET_ID" ]; then
    gitfleet policy delete "$RULESET_ID" --repo "$REPO" --yes >/dev/null 2>&1 || true
  fi
  rm -f "$RULESET_FILE"
  print_summary
}

trap teardown EXIT
setup

step "Validate Ruleset"
expect_exit_0 "ruleset validate succeeds" gitfleet policy validate --file "$RULESET_FILE"

step "List Rulesets"
expect_exit_0 "ruleset list succeeds" gitfleet policy list --repo "$REPO"

step "Check Branch Rules"
expect_exit_0 "ruleset check succeeds" gitfleet policy check main --repo "$REPO"

if [ "${RULESET_MUTATIONS:-0}" = "1" ]; then
  step "Create Ruleset"
  CREATE_JSON=$(gitfleet policy create --file "$RULESET_FILE" --repo "$REPO" --json)
  RULESET_ID=$(echo "$CREATE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["ruleset"]["id"])')
  pass "ruleset create succeeds"

  step "View And Edit Ruleset"
  expect_exit_0 "ruleset view succeeds" gitfleet policy view "$RULESET_ID" --repo "$REPO"
  expect_exit_0 "ruleset edit succeeds" gitfleet policy edit "$RULESET_ID" --file "$RULESET_FILE" --repo "$REPO"

  step "Delete Ruleset"
  expect_exit_0 "ruleset delete succeeds" gitfleet policy delete "$RULESET_ID" --repo "$REPO" --yes
  RULESET_ID=""
else
  skip "ruleset mutations (set RULESET_MUTATIONS=1 to test)"
fi
