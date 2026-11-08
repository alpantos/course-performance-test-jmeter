#!/usr/bin/env bash
# Headless (non-GUI) run + HTML dashboard report. Start the app first: (cd ../sample-app && node server.js)
# Override with e.g.:  ./run.sh -Jthreads=50 -Jhost=localhost -Jport=3000
set -euo pipefail
cd "$(dirname "$0")"
rm -rf report results/run.jtl
jmeter -n -t basic-test-plan.jmx -l results/run.jtl -e -o report -Jthreads=5 -Jloops=2 "$@"
echo "Report: $(pwd)/report/index.html"
