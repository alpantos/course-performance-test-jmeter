# Day 1 – JMeter Basics

## 1. Installation & setup
1. **Java**: JMeter 5.6 needs Java 8+ (17/21 recommended). Check: `java -version`.
   macOS: `brew install openjdk@21` (follow brew's note to link it).
2. **JMeter**: `brew install jmeter` – or download the binary zip from <https://jmeter.apache.org/download_jmeter.cgi>, unzip, and run `bin/jmeter` (`bin/jmeter.bat` on Windows).
3. Verify: `jmeter --version` (this repo was verified with 5.6.3).
4. Start the app under test: `cd ../sample-app && node server.js`, then open <http://localhost:3000>.

## 2. Interface walkthrough
Launch the GUI with `jmeter -t basic-test-plan.jmx`.
* **Left tree** – the test plan; **right pane** – settings of the selected element; **top-right** – run controls (▶ start, ■ stop, 🧹 clear all) and the active/total thread counter.
* Right-click an element → *Add* to build the plan: Threads → Sampler → Config / Timer / Assertion / Listener.
* Elements can be disabled (greyed) and reordered by drag & drop. Save with Ctrl/Cmd-S.
* **Golden rule:** use the GUI to *build and debug*; use non-GUI mode (`./run.sh`) to *run load*.

## 3. Components used in `basic-test-plan.jmx`
| Component | Where | Purpose |
|---|---|---|
| Test Plan + User Defined Variables | root | Global variables `USERNAME`, `PASSWORD` |
| HTTP Request Defaults | root | Host/port once (`-Jhost`, `-Jport` override) |
| HTTP Cookie Manager | root | Stores `SESSIONID` so every request stays in the same session |
| **Thread Group** | `Basic Users` | 5 virtual users, 5 s ramp-up, 2 loops (`-Jthreads -Jrampup -Jloops`) |
| **HTTP Request** samplers | 01–07 | login page → login → dashboard → items → API → logout → 401 check |
| **Timers** | Constant Timer 500 ms | Think time between steps |
| **Assertions** | Response (code/body), JSON Path, Duration | Prove each response is *correct*, not just *returned* |
| **Listeners** | Results Tree, Table, Summary, Aggregate | View results; the Results Tree is for debugging only (heavy under load) |

Note on request 07: a 401 is the *expected* result after logout, so the assertion uses "Ignore Status" – the sample is green only when the session has really been destroyed.

## 4. Exercises
1. Run once with 1 user and inspect the Results Tree (request/response, cookies, assertions).
2. Change the password variable to something wrong – watch the assertions fail.
3. Raise threads to 50 with `./run.sh -Jthreads=50 -Jrampup=20` and read the HTML report in `report/index.html`.
4. Start the app with `SESSION_TTL_SECONDS=5`, add a 10 s timer after login, and observe the 302/401.
