#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

WORKFLOW_FILE="$TMPDIR/test-workflow.yml"

setup() {
  cat > "$WORKFLOW_FILE" <<'EOF'
name: CI
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo hello
EOF
}

teardown() {
  rm -f "$WORKFLOW_FILE"
  print_summary
}

trap teardown EXIT
setup

step "List Workflows"
expect_exit_0 "workflow list succeeds" gitfleet pipeline definition list --repo "$REPO"
expect_json_field "workflow list returns JSON" success true gitfleet pipeline definition list --repo "$REPO"

step "View Missing Workflow"
expect_exit_non0 "workflow view rejects missing workflow" gitfleet pipeline definition view gitfleet-missing-workflow --repo "$REPO"

step "Validate Workflow"
expect_exit_0 "workflow validate succeeds" gitfleet pipeline definition validate "$WORKFLOW_FILE"

step "Preview Workflow"
expect_exit_0 "workflow preview succeeds" gitfleet pipeline definition preview "$WORKFLOW_FILE"

step "Validate Invalid YAML"
cat > "$WORKFLOW_FILE" <<'EOF'
name: Bad
on: [push
jobs:
  test:
    runs-on: ubuntu-latest
EOF
expect_exit_non0 "workflow validate rejects invalid YAML" gitfleet pipeline definition validate "$WORKFLOW_FILE"
