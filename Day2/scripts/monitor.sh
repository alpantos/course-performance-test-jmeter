#!/usr/bin/env bash
# Poor-man's server monitoring for the "Monitoring system performance during tests" session.
# Samples CPU % and memory (RSS) of the sample app every 2 s into a CSV you can plot next to the JMeter report.
#   ./monitor.sh            # watches the process listening on :3000 until Ctrl-C
#   PORT=3999 INTERVAL=1 ./monitor.sh
# In production you would use Grafana/Prometheus, CloudWatch, AppDynamics ....
set -euo pipefail
PORT=${PORT:-3000}
INTERVAL=${INTERVAL:-2}
cd "$(dirname "$0")/.."
mkdir -p results
OUT="results/monitor-$(date +%Y%m%d-%H%M%S).csv"
PID=$(lsof -ti ":$PORT" -sTCP:LISTEN | head -1 || true)
[ -n "$PID" ] || { echo "nothing is listening on port $PORT - start the app first"; exit 1; }
echo "time,cpu_percent,rss_mb" > "$OUT"
echo "Monitoring PID $PID (port $PORT) -> $OUT   (Ctrl-C to stop)"
while kill -0 "$PID" 2>/dev/null; do
  read -r cpu rss < <(ps -p "$PID" -o %cpu=,rss=)
  printf '%s,%s,%s\n' "$(date +%H:%M:%S)" "$cpu" "$(awk -v r="$rss" 'BEGIN{printf "%.1f", r/1024}')" | tee -a "$OUT"
  sleep "$INTERVAL"
done
