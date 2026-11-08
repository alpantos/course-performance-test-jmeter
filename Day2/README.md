# Day 2 – Advanced Test Plan (`advanced-crud-test-plan.jmx`)

Run: start the app, then `./run.sh` (or open the plan in the GUI and set `-Jdatadir` to this folder, e.g. `jmeter -t advanced-crud-test-plan.jmx -Jdatadir=.`).

| Concept | Implementation |
|---|---|
| Parameterisation | **CSV Data Set Config** `users.csv` (admin, user1, user2) – each thread logs in with a different user |
| Correlation (regex) | `CSRF` token extracted from `/login` HTML, sent in the login POST |
| Correlation (JSON) | `itemId` extracted from the *Create* response with JSON Path `$.id`, reused in later calls |
| Session handling | Cookie Manager (cleared each iteration → every iteration is a fresh session); login via real form flow with redirect |
| Transactions | TX01 Login, TX02 CRUD lifecycle, TX03 Logout (parent samples → per-business-step metrics) |
| CRUD | Create (POST) → Read → Update (PUT) → Read → Search → Delete → Read (expect 404) |
| Logic controller | If Controller – admin also loads the HTML items page |
| Timers | Uniform Random Timer 300–800 ms |
| Assertions | Response code/body/headers, JSON Path with expected values |
| Web UI CRUD (TG3) | Browser-style flow through the HTML forms: Add → Search (extract `uiId` with regex) → open Edit form → Save → Verify → Delete → confirm 404; CSRF token extracted from the items page; unique name via User Parameters (`${__UUID}`) |
| Negative testing | Thread group 2 (plus TX05 in TG3: invalid item → 400, bad CSRF → 403): no cookie → 401, bad password → 401, bad CSRF → error page |
| Parameters | `-Jthreads -Jrampup -Jloops -Jui_threads -Jui_rampup -Jui_loops -Jneg_threads -Jhost -Jport -Jdatadir` |
| Listeners | Errors-only Results Tree, Summary, Aggregate (+ HTML report via `run.sh`) |

## Exercises
* Add a Debug Sampler after login to see `CSRF`, `username` and `itemId` values.
* Replace the random timer with a Constant Throughput Timer and target 60 req/min.
* Add a Duration Assertion (e.g. 500 ms) to the CRUD requests.
* Note on thread-safety: items are shared data – create unique names (`Item-${__threadNum}-…`) so threads do not collide.
