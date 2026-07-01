#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/env.sh"

PAGES_WAS_CONFIGURED=false
PAGES_ORIGINAL_SOURCE=""
PAGES_ORIGINAL_BUILTYPE=""

setup() {
  local status_json
  status_json=$(gitfleet site status --repo "$REPO" --json 2>/dev/null) || true

  if echo "$status_json" | grep -q '"configured":true'; then
    PAGES_WAS_CONFIGURED=true
    PAGES_ORIGINAL_SOURCE=$(echo "$status_json" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('source',{}); print(s.get('branch','main'))" 2>/dev/null || echo "main")
    PAGES_ORIGINAL_BUILTYPE=$(echo "$status_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('buildType','legacy'))" 2>/dev/null || echo "legacy")
  fi
}

teardown() {
  if [ "$PAGES_WAS_CONFIGURED" = true ]; then
    step "Reconfiguring Pages To Original State"
    gitfleet site deploy --source "$PAGES_ORIGINAL_SOURCE" --build-type "$PAGES_ORIGINAL_BUILTYPE" --repo "$REPO" >/dev/null 2>&1 && \
      pass "Pages restored to original configuration" || \
      fail "Pages restore failed"
  else
    step "Unpublishing Pages"
    if gitfleet site status --repo "$REPO" --json 2>/dev/null | grep -q '"configured":true'; then
      gitfleet site unpublish --yes --repo "$REPO" >/dev/null 2>&1 && pass "Pages unpublished" || fail "Pages unpublish failed"
    else
      skip "Pages not configured, nothing to unpublish"
    fi
  fi
  print_summary
}

trap teardown EXIT
setup

step "Status On Configured Or Unconfigured Repo"
if gitfleet site status --repo "$REPO" >/dev/null 2>&1; then
  pass "pages status works (site is configured)"
else
  expect_output "pages status reports unconfigured" "not configured" gitfleet site status --repo "$REPO"
fi

step "Status JSON Output"
if gitfleet site status --repo "$REPO" --json >/dev/null 2>&1; then
  pass "pages status --json works"
else
  skip "pages status --json (Pages not configured)"
fi

step "Deploy With Default Legacy Build Type"
if gitfleet site deploy --source main --repo "$REPO" >/dev/null 2>&1; then
  pass "pages deploy --source main succeeded"
else
  echo "[WARN] pages deploy may fail if branch lacks Pages content"
fi

step "Deploy With /docs Path"
gitfleet site deploy --source main --path /docs --repo "$REPO" >/dev/null 2>&1 && \
  pass "pages deploy --path /docs succeeded" || \
  skip "pages deploy --path /docs (may need /docs on branch)"

step "Deploy With Workflow Build Type"
if gitfleet site deploy --source main --build-type workflow --repo "$REPO" >/dev/null 2>&1; then
  pass "pages deploy --build-type workflow succeeded"
else
  skip "pages deploy --build-type workflow (may need Actions workflow file)"
fi

step "Status After Deploy"
expect_exit_0 "pages status returns 0" gitfleet site status --repo "$REPO"
expect_output "status shows source" "Source" gitfleet site status --repo "$REPO"

step "Status JSON Fields"
expect_json_field "JSON has success=true" "success" "true" gitfleet site status --repo "$REPO"
expect_json_field "JSON has configured=true" "configured" "true" gitfleet site status --repo "$REPO"

step "Unpublish Without --yes Requires Confirmation"
output=$(gitfleet site unpublish --repo "$REPO" </dev/null 2>&1) || true
if echo "$output" | grep -qi "unpublish\|confirm"; then
  pass "pages unpublish without --yes requires confirmation"
else
  fail "pages unpublish without --yes did not prompt"
fi

step "Unpublish With --yes"
expect_exit_0 "pages unpublish --yes" gitfleet site unpublish --yes --repo "$REPO"

step "Unpublish Already-Removed Site"
expect_output "reports not configured" "not configured" gitfleet site unpublish --yes --repo "$REPO"

step "Deploy With Invalid Path /src"
expect_output "rejects invalid path" "must be" gitfleet site deploy --source main --path /src --repo "$REPO"

step "Deploy With Invalid Build Type"
expect_output "rejects invalid build type" "build type" gitfleet site deploy --source main --build-type invalid --repo "$REPO"

step "Deploy Without --source"
expect_exit_non0 "pages deploy without --source" gitfleet site deploy --repo "$REPO"
