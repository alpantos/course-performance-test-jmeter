# Performance Test Report – <application> – <date>

*(Structure from the Day 2 deck, slides 76–92. Delete the hints in italics.)*

## 1. Introduction
- **Objective:** *what question does this test answer? e.g. "Can the system serve 500 concurrent users with p90 < 2 s?"*
- **Test environment:** *hardware, OS, app/DB versions, how it differs from production (slides 102–106)*
- **Scope:** *which journeys / APIs were tested – and what was deliberately left out*

## 2. Test plan summary
- **Scenarios & mix:** *e.g. Browse 50 % / Manage 30 % / Report 15 % / Flaky 5 % (08-load-scenario.jmx)*
- **Virtual users & load model:** *users, ramp-up, steady-state duration, think time (Gaussian 300 ± 100 ms)*
- **Test data:** *CSV files, volumes*
- **Start / end time:** *needed to correlate with monitoring*

## 3. Key results
| Transaction | Samples | Avg (ms) | p90 (ms) | p95 (ms) | Max (ms) | Error % | Throughput (/s) | SLA | Pass? |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

- **Error rate overall:** …  **Top error causes:** …
- **Resource utilisation (from monitoring):** CPU … % · memory … MB · disk … · network …

## 4. Graphs
*Response time distribution · Throughput vs response time · Error rate over time · Active threads vs response time (HTML report: results/report-*/index.html)*

## 5. Bottleneck identification
- **Slow transactions:** …
- **Error analysis:** *status codes, assertion failures, when they started (slide 80)*
- **Server-side:** *the resource that saturated first, and at how many users (slides 82–86)*

## 6. Conclusions
- **Did it meet the requirements?** …
- **Scalability:** …
- **Stability:** …

## 7. Recommendations
- **Tuning:** …
- **Re-test plan:** …
- **Scaling advice:** …

## 8. Appendices
`.jmx` plan(s) · `.jtl` raw results · monitoring CSV · error samples (request/response)
