#!/usr/bin/env bash
# Regression check: starts the sample app on a spare port, runs every Day plan headless
# with a small load, and fails if ANY sample or assertion fails.   Usage: ./validate.sh
# Plans that are *meant* to fail (exercises) are run with run_expect_fail and must fail.
set -uo pipefail
cd "$(dirname "$0")"
PORT=${VALIDATE_PORT:-3999}
OUT=$(mktemp -d)
PORT=$PORT node sample-app/server.js >"$OUT/app.log" 2>&1 &
APP=$!
trap 'kill $APP 2>/dev/null; wait $APP 2>/dev/null; rm -rf "$OUT"' EXIT
for _ in $(seq 20); do curl -sf "localhost:$PORT/health" >/dev/null && break; sleep 0.5; done
curl -sf "localhost:$PORT/health" >/dev/null || { echo "App failed to start"; cat "$OUT/app.log"; exit 1; }

fail=0
# mode: pass | fail ; plan ; extra jmeter args
run() {
  local mode=$1 plan=$2; shift 2
  local jtl="$OUT/$(basename "$plan").jtl"
  jmeter -n -t "$plan" -l "$jtl" -Jport=$PORT -Jthink=50 -Jthink_dev=20 "$@" >"$OUT/jmeter.log" 2>&1 || { echo "FAIL $plan: jmeter error"; tail -20 "$OUT/jmeter.log"; fail=1; return; }
  python3 - "$mode" "$plan" "$jtl" <<'PY' || fail=1
import csv, sys
mode, plan, jtl = sys.argv[1:4]
rows = list(csv.DictReader(open(jtl)))
bad = [(r['label'], r['responseCode'], r['failureMessage']) for r in rows if r['success'] != 'true']
good = bool(rows) and (not bad if mode == 'pass' else bool(bad))
tag = 'PASS' if good else 'FAIL'
note = '' if mode == 'pass' else ' (expected to fail: exercise)'
print(f"{tag} {plan}: {len(rows)} samples, {len(bad)} failures{note}")
if not good:
    for b in bad[:10]: print("   ", b)
sys.exit(0 if good else 1)
PY
}

run pass Day1/basic-test-plan.jmx -Jthreads=2 -Jloops=1
# Day 2 - every plan in test-plans/ (small load so the whole suite stays quick)
run fail Day2/test-plans/00-recorded-script-exercise.jmx
run pass Day2/test-plans/00b-recorded-script-solution.jmx
run pass Day2/test-plans/01-timers.jmx
run pass Day2/test-plans/02-preprocessors-postprocessors.jmx
run pass Day2/test-plans/03-controllers.jmx
run pass Day2/test-plans/04-config-elements.jmx
run pass Day2/test-plans/05-assertions.jmx
run pass Day2/test-plans/06-api-soap-scripting.jmx
run pass Day2/test-plans/07-advanced-crud-test-plan.jmx -Jthreads=3 -Jloops=1 -Jui_threads=3 -Jui_loops=1
run pass Day2/test-plans/08-load-scenario.jmx -Jusers=3 -Jrampup=2 -Jduration=10 -Jflaky_rate=0
run pass Day2/test-plans/09-stepping-load-profile.jmx -Jstep_s=4 -Jrate1=1 -Jrate2=2 -Jrate3=3 -Jdrain_s=5
run pass Day2/test-plans/10-populate-items.jmx
# Add new plans here (Day3, ...)
exit $fail
