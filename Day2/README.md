# Day 2 – Advanced JMeter & Practical Performance Testing

Everything for the Day 2 deck (*D2 – SECC Performance Testing Course*). **Presenter's briefing: [PREP-GUIDE.md](PREP-GUIDE.md).**

```bash
cd ../sample-app && node server.js        # terminal 1  (http://localhost:3000)
cd Day2 && ./run.sh 01                    # terminal 2  – run a plan headless + HTML report
jmeter -t test-plans/01-timers.jmx        # or open it in the GUI (paths are relative to the .jmx file)
```

All plans use **CSV Data Set Config** (`data/*.csv`) for users, items, search terms and SOAP inputs, and **Gaussian Random Timers** for think time
(`-Jthink=300 -Jthink_dev=100` → ~300 ms ± 100 ms; the deck's slide values).

## Test plans (`test-plans/`)

| Plan | Deck slides | What it shows | Handy parameters |
|---|---|---|---|
| `00-recorded-script-exercise.jmx` | 4–5, 70–72 | A "recorded" script with hard-coded CSRF token/ids/credentials. **Fails on purpose** – students fix it live. | – |
| `00b-recorded-script-solution.jmx` | 71–72, 93–95 | The fixed version: Regex + Boundary extractors, CSV users/items, Gaussian timers, assertions. | |
| `01-timers.jmx` | 11–17 | Constant, **Gaussian**, Uniform, Constant Throughput, Synchronizing timers, each scoped by a Simple Controller. | `-Jthink -Jthink_dev -Jconst_ms -Jtput -Jthreads` |
| `02-preprocessors-postprocessors.jmx` | 18–34 | JSR223 + BeanShell pre-processors, URL Re-writing Modifier (session id in URL, no cookies), Regex / CSS / Boundary / JSON extractors, JSR223 / BeanShell / Debug post-processors. | |
| `03-controllers.jmx` | 35–43 | Simple, Transaction, If, Loop, While, Random and ForEach controllers. | |
| `04-config-elements.jmx` | 45–53 | Cookie Manager, HTTP Defaults, Header Manager, User Defined Variables, **Cache Manager** (watch the 304s), CSV Data Set, Counter. | |
| `05-assertions.jmx` | 54–63 | Response, Duration, Size, XML, HTML, XPath, JSON and JSR223 assertions (+ a disabled assertion that fails on purpose). | `-Jsla_ms` |
| `06-api-soap-scripting.jmx` | 6–7, 33 | Data-driven SOAP calls to the local calculator, XPath Extractor, fault handling. | |
| `07-advanced-crud-test-plan.jmx` | 64–69, 93–101 | Full CRUD through the JSON API **and** the HTML forms (CSRF + id correlation), negative/security checks. | `-Jthreads -Jui_threads -Jloops` |
| `08-load-scenario.jmx` | 64–75 | **Mixed workload** (browse 50 % / manage 30 % / report 15 % / flaky 5 %), SLA assertions, ramp-up + steady-state load model. The plan to analyse. | `-Jusers -Jrampup -Jduration -Jcpu_ms -Jslow_ms -Jflaky_rate -Jsla_ms` |
| `09-stepping-load-profile.jmx` | 9–10, 79–82 | Stepped load with the built-in **Open Model Thread Group** (no plugin): arrival rate 2 → 4 → 6 users/s, each step held `step_s` seconds. | `-Jrate1 -Jrate2 -Jrate3 -Jstep_s -Jdrain_s` |

## Data (`data/`)
`users.csv` (3 static logins) · `items.csv` (15 products with a new price for the update step) · `search_terms.csv` (incl. a no-match term) · `calculator.csv` (SOAP operations with the expected result).

## Analysis & reporting (deck slides 74–92)
```bash
cd Day2
(cd ../sample-app && node server.js) &              # if not running
./scripts/monitor.sh &                               # CPU % / memory of the app -> results/monitor-*.csv
./run.sh 08 -Jusers=40 -Jrampup=30 -Jduration=120    # the HTML report lands in results/report-08-load-scenario/
```
Use [`templates/performance-report-template.md`](templates/performance-report-template.md) for the final report (the 8 sections from the slides).

**Find the bottleneck:** raise `-Jusers` until response times climb, then check `monitor.csv` – the app is single-threaded, so `/api/cpu` saturates one core
(CPU-bound: latency grows with users) while `/api/slow` only waits (I/O-bound: latency stays flat). That contrast is the slide-86 story.

## Regression check
`../validate.sh` runs every plan (small load) and fails on any failed sample/assertion; `00-…exercise` is expected to fail.
