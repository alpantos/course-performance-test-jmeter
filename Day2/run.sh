#!/usr/bin/env bash
# Run one Day 2 plan headless and build the HTML dashboard report.
#   ./run.sh 08                       # plan whose file name starts with "08"
#   ./run.sh 08-load-scenario -Jusers=50 -Jduration=180
#   ./run.sh 01 -Jthink=1000 -Jthink_dev=300
# Start the app first:  (cd ../sample-app && node server.js)
set -euo pipefail
cd "$(dirname "$0")"
[ $# -ge 1 ] || { echo "usage: $0 <plan-prefix> [jmeter -J options]"; ls test-plans; exit 1; }
prefix=$1; shift
plan=$(ls test-plans/"$prefix"*.jmx 2>/dev/null | head -1 || true)
[ -n "$plan" ] || { echo "no plan matches '$prefix'"; ls test-plans; exit 1; }
name=$(basename "$plan" .jmx)
mkdir -p results
rm -f "results/$name.jtl"
rm -rf "results/report-$name"
jmeter -n -t "$plan" -l "results/$name.jtl" -e -o "results/report-$name" "$@"
echo "Report: $(pwd)/results/report-$name/index.html"
