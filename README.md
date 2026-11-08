# Performance Testing with JMeter – Course Code

| Folder | Content |
|---|---|
| [`sample-app/`](sample-app) | Minimal Node.js web app (login, session cookie, items CRUD) used as the system under test. **Local use only.** |
| [`Day1/`](Day1) | Basics: installation, GUI walkthrough, first test plan (thread group, HTTP requests, timers, assertions, listeners). |
| [`Day2/`](Day2) | Advanced: CSV data, correlation, transactions, CRUD lifecycle, logic controllers, negative/security checks. |
| [`Day3/`](Day3) | Reserved for Day 3 material. |

## Quick start
```bash
cd sample-app && node server.js        # http://localhost:3000  (Node 18+, no npm install needed)
cd Day1 && ./run.sh                    # headless run + HTML report in Day1/report
jmeter -t Day1/basic-test-plan.jmx     # or open in the GUI
```
