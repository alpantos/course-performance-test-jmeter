#!/usr/bin/env bash
# Regression check: starts the sample app on a spare port, runs every Day plan headless
# with small load, and fails if ANY sample or assertion fails.   Usage: ./validate.sh
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
run() { # plan, extra args...
  local plan=$1; shift
  local jtl="$OUT/$(basename "$plan").jtl"
  jmeter -n -t "$plan" -l "$jtl" -Jport=$PORT "$@" >"$OUT/jmeter.log" 2>&1 || { echo "FAIL $plan: jmeter error"; tail -20 "$OUT/jmeter.log"; fail=1; return; }
  python3 - "$plan" "$jtl" <<'PY' || fail=1
import csv, sys
rows = list(csv.DictReader(open(sys.argv[2])))
bad = [(r['label'], r['responseCode'], r['failureMessage']) for r in rows if r['success'] != 'true']
print(f"{'FAIL' if bad or not rows else 'PASS'} {sys.argv[1]}: {len(rows)} samples, {len(bad)} failures")
for b in bad[:10]: print("   ", b)
sys.exit(1 if bad or not rows else 0)
PY
}
run Day1/basic-test-plan.jmx -Jthreads=2 -Jloops=1
run Day2/advanced-crud-test-plan.jmx -Jdatadir=Day2 -Jthreads=3 -Jloops=1 -Jui_threads=3 -Jui_loops=1
# Add new plans here (Day3, ...)
exit $fail
