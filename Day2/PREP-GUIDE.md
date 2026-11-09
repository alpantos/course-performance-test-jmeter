# Day 2 – Presenter's Prep Guide

*Deck: "D2 – SECC Performance Testing Course" (124 slides). Companion code: this folder + `../sample-app`.*

## 1. The day in one paragraph
Day 1 was concepts. **Day 2 is the "hands on keyboard" day**: students go from *recording a script* → *making it robust* (correlation, parameterisation, timers, assertions, controllers) → *designing a realistic scenario* → *running it, reading the graphs and writing the report*. The emotional arc is: **"it works!" → "wait, why does it fail with 2 users?" → "now I can see exactly what's wrong"**. Plan your energy around that.

## 2. What to expect

### Audience (assume this until you learn otherwise)
- Mixed QA / developers / a few ops or managers. Most have *used* a browser dev tool, few have scripted load.
- Everyone is "JMeter-installed" – but **~1 in 5 will have a broken setup** (Java path, proxy, corporate laptop). Do a 5-minute "does `jmeter -v` work?" check at the very start.
- The *quiet* ones are usually stuck, not bored. Walk the room during every exercise.

### Where the day will wobble (and your pre-planned answer)
| Moment | What happens | Your move |
|---|---|---|
| Recording (slides 4–5) | BlazeMeter needs an account/extension; corporate Chrome blocks it; HTTPS recorder needs the JMeter root CA | Demo the **JMeter Recording template** live, show BlazeMeter as a 2-min screencast, and give them `00-recorded-script-exercise.jmx` so *nobody is blocked* |
| First timer slides (8–17) | Slides 8–10 are titled "Timers" but are **Thread Groups**; slide 15 has a math error (see §7) | Say it out loud: "typo in my slides – here's the real rule" – instant credibility |
| JDBC slides (22, 32) | No database in the room | Explain the idea, show the SQL, *don't* demo. Tell them it needs a JDBC driver in `lib/` + JDBC Connection Configuration |
| After lunch / slide ~60 | Assertions slides are dense, energy dips | Switch to `05-assertions.jmx` and **enable the disabled failing assertion** – broken things wake people up |
| Hands-on (slide 108) | ParaBank is slow/down, or 20 people hit it at once | Use the local sample app as the fallback (§6) |
| Results (slides 79–86) | Screenshots of a 1000-user Jenkins test feel abstract | Run `08-load-scenario.jmx` live and reproduce the same story at small scale |

### Questions you will get (cheat-sheet answers)
- **"Why is my JMeter test slower than the real browser?"** – It isn't a browser: no JS, no rendering, no caching unless you add the Cache Manager and "Retrieve embedded resources".
- **"How many users can one JMeter handle?"** – Hundreds to a few thousand threads on a decent laptop *for simple scripts*; heavy Groovy, big responses, and View Results Tree in the plan lower that. Run headless; distribute when the load generator itself hits ~80 % CPU.
- **"Think time – do I really need it?"** – Without it you test a robot hammering the server, not users. It changes concurrency vs throughput dramatically.
- **"Gaussian vs Uniform?"** – Gaussian clusters around a typical pause with a few outliers (human-like); Uniform is flat (every value in the range equally likely).
- **"Why does the test pass but the app is slow?"** – No assertion on time. Add Duration Assertions / SLAs; a 200 with an error page is still "success" without a body assertion.
- **"BeanShell or Groovy?"** – JSR223 + Groovy (compiled, cached – check "Cache compiled script"). BeanShell is legacy.
- **"JMeter vs k6/Gatling/LoadRunner?"** – Day 1 covered tools; short answer: JMeter = GUI to learn, huge plugin/ecosystem, thread-per-user model is heavier than k6/Gatling's event-driven model.
- **"Can I test our production?"** – Only with written approval, off-peak, and a kill switch. Never test someone else's site (ParaBank etiquette, §6).

## 3. Topics & suggested run of the day
*(Durations are suggestions that add up to a full day; trim "Case studies" or "Common challenges" if you run long.)*

| # | Block (agenda) | Slides | Min | Demo / file | Key message |
|---|---|---|---|---|---|
| 1 | Review of Day 1 | 3 | 15 | – | Ask 3 quick-fire questions instead of re-presenting (e.g. "What's the difference between load and stress?") |
| 2 | Web recording (JMeter template, BlazeMeter) | 4–5 | 35 | Recording template live; `00-recorded-script-exercise.jmx` | A recording is a *draft*, never a finished script |
| 3 | API scripting (SOAP/REST) | 6–7 | 20 | `06-api-soap-scripting.jmx` | Same HTTP sampler, different body + headers |
| 4 | Thread groups (closed vs open model) & **timers** | 8–17 | 50 | `01-timers.jmx`, `09-stepping-load-profile.jmx` | Timers model *user behaviour*. **Gaussian = realistic think time** |
| 5 | Pre-processors & post-processors | 18–34 | 45 | `02-preprocessors-postprocessors.jmx` | Pre = prepare the request, Post = harvest the response |
| 6 | Controllers | 35–43 | 35 | `03-controllers.jmx` | Controllers decide *flow* (what, when, how often) |
| – | **Break** | 44 | 15 | | |
| 7 | Config elements | 45–53 | 35 | `04-config-elements.jmx` | CSV = realistic data. Cookie manager = sessions. Cache = realism |
| 8 | Assertions | 54–63 | 30 | `05-assertions.jmx` | A load test without assertions measures speed of *errors* |
| 9 | Building scenarios (recorded → correlated → report) | 64–78 | 40 | `00b-…solution.jmx`, `07-advanced-crud-test-plan.jmx` | Objectives → key actions → scenario → script → run → report |
| 10 | Analysing results + monitoring | 79–92 | 40 | `08`, `09`, `scripts/monitor.sh`, HTML report | Correlate *response time*, *threads*, *errors* and *CPU* on the same time axis |
| 11 | Challenges & best practices | 93–106 | 25 | – | Show each as a "war story" (§5) rather than reading |
| – | **Break** | 107 | 15 | | |
| 12 | Hands-on (ParaBank + local app) | 108–109 | 90 | §6 | Scripting + load model + run |
| – | **Break** | 110 | 10 | | |
| 13 | Case studies + industry metrics | 111–121 | 35 | §5 | Metrics differ by industry; start from business requirements |
| 14 | Q&A + recap | 122–124 | 15 | | |

## 4. How to win the room
1. **Start with a failure, end with a fix.** Run `00-recorded-script-exercise.jmx` in the first 10 minutes. It fails (hard-coded CSRF token) – ask "why?" Then solve it step by step across the day: correlation (block 5), CSV parameterisation (block 7), assertions (block 8) → `00b` solution. One story, not eleven topics.
2. **Predict-then-reveal.** Before each demo ask "what do you think will happen?" – e.g. before `01-timers`: "If I set 60 requests/minute with a Constant Throughput Timer and 20 users, what's the delay per user?" Being wrong once makes the lesson stick.
3. **Make it visible.** Keep *View Results Tree* open while you run a single user; show the actual cookie, the CSRF token in the response, the 304 for the cached CSS (`04-config-elements.jmx`). Then switch it off and say: "this listener kills performance under load" (best practice #9).
4. **Break something on purpose, live.** Enable the disabled failing assertion in `05`; change a CSV password; set `-Jflaky_rate=50`. Debugging live is the skill they came for.
5. **Tie everything to the business.** Slides 64–69/118–121: start every scenario with "who are the users, what do they do, what must be true?" Use the sample app's Alpantos Lab as the "company".
6. **Use numbers, not adjectives.** "Response time got worse" → "p90 went from 80 ms to 1.4 s at ~15 users, exactly when CPU hit 100 %". Make them say numbers too.
7. **Pair them up for hands-on.** One drives, one navigates; swap at each checkpoint. Weak laptops/networks stop being a blocker.
8. **Checkpoints with a safety net.** Every exercise has a ready solution file (`00b`, plans `01–09`). If someone's stuck for >5 minutes, they open the solution and diff it with theirs.
9. **Own the typos.** The deck has a few (see §7). Correcting them confidently is better than hoping nobody notices.
10. **Close each block with one sentence** they can repeat tomorrow (the "Key message" column above).

### Activities that work well
- **Think-time experiment (10 min):** two groups run `01-timers` with Constant 0 ms vs Gaussian 300 ± 100 ms – compare throughput and response times. Debrief: robots vs users.
- **Correlation race:** who fixes `00-recorded-script-exercise.jmx` first? (Hint cards: CSRF → Regex Extractor; item id → Boundary Extractor.)
- **"Find the bottleneck" game:** run `08` at 10, 30, 60 users; ask them to point at the graph where it breaks and name the cause (CPU: `/api/cpu`; I/O wait: `/api/slow`; errors: `/api/flaky`).
- **SLA bet:** write the SLA on a flip chart ("p90 < 2 s, errors < 1 %"), then check it against the report.

## 5. Relevant examples to share
*Check the figures before quoting them on a slide – they are widely reported, not verified by us.*

**Real-world stories (each maps to a lesson)**
- **HealthCare.gov launch (US, Oct 2013)** – reported to have been sized for a small fraction of the traffic it got, with end-to-end testing squeezed late in the schedule. *Lesson: test early, test the whole chain, with realistic volumes (slides 65–66).*
- **Pokémon GO launch (July 2016)** – the developer said traffic reached about 50× the original target. *Lesson: capacity planning and spike/stress testing (Day 1 test types).*
- **Ticket on-sales (e.g. Ticketmaster's 2022 Eras Tour presale)** – the company publicly cited record traffic multiples versus its previous peak. *Lesson: bots + real fans = traffic you cannot predict; design for degradation (queues, rate limits).*
- **Retail peak events (Black Friday, Prime Day)** – periodic reports of slow pages/outages in the first minutes. Ties to case study 1 (slide 111). *Lesson: the first 10 minutes of a sale are the real test; ramp-up shape matters.*
- **Latency ⇄ revenue claims** – the often-quoted "100 ms ≈ 1 % sales" (Amazon, slide 119), Google's "+0.5 s ≈ −20 % traffic" experiment, Akamai/Walmart conversion studies. *Treat as "directionally right, old, not universal" – great for justifying SLAs, poor as hard facts.*
- **Month-end / salary-day banking peaks** – ties to slide 115. *Lesson: workload models have calendars.*

**Analogies that land**
- *Thread = a customer in the shop; ramp-up = doors opening gradually; think time = browsing; throughput = checkouts per minute; the single Node thread = one cashier.* (`/api/cpu` is a cashier who needs 30 ms per customer: at 30+ customers/s the queue explodes – no matter how fast the rest is.)
- *Correlation = a cloakroom ticket*: the server hands you a number (token) and you must show **that** number later; a recorded script shows yesterday's ticket.
- *Percentiles vs average* = "the average river depth is 1 m – and you can still drown." Show avg vs p95 on `08`.
- *Gaussian timer* = commute times: usually ~30 min, rarely 20 or 40; *Uniform* = a die roll.

**Examples from the sample app you can demo in 2 minutes each**
| Concept | Where |
|---|---|
| CSRF correlation | `00`/`00b` – login form token |
| Session cookies vs session-in-URL | `04` (cookies) vs `02` TG2 (URL Re-writing, `?sid=`) |
| 304 / browser cache | `04` – Cache Manager + embedded resources |
| Data-driven testing | every plan – `data/*.csv` |
| SOAP/XML, XPath | `06`, `05` – `/soap/calculator` |
| CPU-bound vs I/O-bound vs flaky | `08` – `/api/cpu`, `/api/slow`, `/api/flaky` |

## 6. Hands-on session (slides 108–109)
**ParaBank (https://parabank.parasoft.com/)** is a public shared demo bank run by Parasoft for learning. Its availability and speed are outside your control and **it is not yours to load-test**.
- Keep it to **1–2 users, a handful of iterations**, exploration + scripting only; never run the "load model" step against it with the whole class at once.
- Registration creates real (demo) accounts – have students use throw-away values, and parameterise with a CSV of unique usernames (`${__UUID}` suffix).
- **The load/execution step (slides 109 steps 5–6) should run on the local sample app** (`08-load-scenario.jmx`) – safe, reproducible, and has monitoring (`scripts/monitor.sh`).
- **Fallback if ParaBank is down:** run the whole exercise on the sample app (login → browse → add/edit/delete item → logout). Same skills, zero risk.

Suggested structure (90 min): Explore + define objectives (15) → agree scenario on the flip chart (10) → script (35, pairs; hints: recording template, then fix) → load model (10) → run + results (20).

## 7. Deck notes – small fixes to make before presenting
| Slide | Issue | Suggested fix |
|---|---|---|
| 8–10 | Titles say "Detailed JMeter Features – Timers" but the content is **Thread Group / Stepping / Ultimate** | Retitle "… – Thread Groups" |
| 15 | Uniform Random Timer example says "between **200** ms and 500 ms (300 + 200)". The delay is *constant offset + random(0…max)* → **300–500 ms** | Fix the text (or use offset 200 + max 300) |
| 14 | Gaussian: say clearly that delay = offset + Gaussian × deviation; ~68 % within ±1 deviation, ~95 % within ±2 | Add one sentence + a small bell-curve picture |
| 36 | The *Simple Controller* example text is a copy of the Transaction Controller's ("single transaction") | "Organise requests – no timing, no sample generated" |
| 46 | Title reads "Types of JMeter **Controllers**" on the Config Elements table | "Types of Configuration Elements" |
| 22, 41, 62 | Typos: "DBC Pre-processor", "wile loop", "add a JSON Path expression like to validate it" | Fix |
| 41 | `__javaScript(...)` is slow and discouraged | Use `${__groovy(Integer.parseInt(vars.get("Rand")) <= 5)}` (`03-controllers.jmx` does) |
| 19, 23, 34 | BeanShell is legacy | Say "prefer JSR223 + Groovy; BeanShell for old scripts" |
| 6–7 | The SOAP example uses an external public service (dneonline.com) that may be down | Use the local `/soap/calculator` in `06-api-soap-scripting.jmx` |
| 86 | "CPU utilization graph … memory utilization increased" (copy-paste) | Reword |
| 105–106 | "CPU 60 % → 30 % with double the CPU" assumes linear scaling | Add the caveat: queuing is **non-linear**; use it only as a rough estimate and validate in a prod-like environment |
| 12 / 36 | Fine, but mention **Constant Throughput Timer** only *caps* throughput – it cannot create more than the threads can produce | One sentence |

## 8. Things the deck mentions that need extra setup
- **Stepping / Ultimate Thread Group (slides 9–10)** are *plugin* elements and will not appear in a plain JMeter install. Don't fight the install: use JMeter's built-in **Open Model Thread Group** (`Add → Threads (Users) → Open Model Thread Group`, JMeter 5.5+), which `09-stepping-load-profile.jmx` uses. Optional plugin install: `Options → Plugins Manager` → *Custom Thread Groups* (needs internet; restart JMeter).
- **Open vs closed model – a great teaching moment.** The standard / Stepping / Ultimate groups are *closed*: you fix the **number of users**, throughput is whatever the system allows (a slow server slows everyone down). The Open Model group is *open*: you fix the **arrival rate** (users per second), and users keep arriving even if the system is slow – so queues build up and active users grow, like real internet traffic or a sale starting. Rule of thumb (Little's law): *active users ≈ arrival rate × time each user spends in the system*. Ask the room: "what happens to a closed test when the server slows down? And to an open one?" Demo: run `09` and `08` side by side in the HTML report (Active Threads Over Time).
- **Slide-9/10 talking point:** Stepping = "hold N users for X seconds, add M more"; Ultimate = a fully custom ramp-up / hold / shutdown profile. In the Open Model group the same shapes are one schedule string: `rate(2/sec) random_arrivals(30 sec) random_arrivals(1 sec) rate(4/sec) random_arrivals(30 sec) pause(10 sec)`. Remember the trailing `pause(...)`: the group interrupts running users when the schedule ends.
- **JDBC Pre/Post-processors (slides 22, 32)** need a database and a JDBC driver in `lib/`. Not included – explain, show the SQL.
- **BlazeMeter recorder (slide 5)** needs a BlazeMeter account and the Chrome extension; the JMeter Recording template (slide 4) needs a browser proxy set to `localhost:8888` and, for HTTPS, the JMeter test CA certificate.
- **Grafana / AppDynamics / CloudWatch (slides 87–90)** – not installed. `scripts/monitor.sh` is the local stand-in. For a deeper demo: JMeter *Backend Listener* → InfluxDB → Grafana (needs Docker).

## 9. Pre-flight checklist
**The day before**
- [ ] `./validate.sh` is green (runs every plan; takes ~2 min).
- [ ] Open each plan once in the GUI; check the CSV paths resolve (they are relative to the `.jmx`).
- [ ] Fix the slide typos in §7; decide whether to show the plugin install live.
- [ ] Record a 2-min BlazeMeter screencast as a backup.
- [ ] Print or share the solution files (`00b`, `01–09`) via a USB stick / shared drive.
- [ ] Check ParaBank loads (and that you know the fallback).
- [ ] Prepare a flip chart: objectives / key actions / SLA template.

**30 minutes before**
- [ ] `cd sample-app && node server.js` → http://localhost:3000 logs in (`admin` / `password123`).
- [ ] `jmeter -v` works; GUI scale/zoom readable from the back row (Options → Zoom In).
- [ ] Close heavy apps; plug in power; disable sleep.
- [ ] Disable *View Results Tree* before any load run (it is `errors only` in the shipped plans).
- [ ] Browser: item page open for the "what the user sees" contrast.

## 10. Where CSV files and Gaussian timers are used
| Plan | CSV Data Set(s) | Gaussian Random Timer |
|---|---|---|
| 00b | users, items | think time between pages |
| 01 | users, search terms | **block B** (the comparison against Constant/Uniform) |
| 02 | users, items | after list items |
| 03 | users, search terms, items | in Transaction, Loop and ForEach |
| 04 | users, items | between dashboard visits |
| 05 | users, calculator | – (assertion focus) |
| 06 | calculator | between SOAP calls |
| 07 | users, items, search terms | CRUD and UI flows |
| 08 | users, items, search terms | between actions (the load model) |
| 09 | users, search terms | between actions |

Tune everywhere at once: `-Jthink=300 -Jthink_dev=100` (milliseconds).
