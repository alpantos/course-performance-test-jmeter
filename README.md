# Performance Testing with JMeter – Course Code

| Folder | Content |
|---|---|
| [`sample-app/`](sample-app) | Minimal Node.js web app (login, session cookie, items CRUD) used as the system under test. **Local use only.** |
| [`Day1/`](Day1) | Basics: installation, GUI walkthrough, first test plan (thread group, HTTP requests, timers, assertions, listeners). |
| [`Day2/`](Day2) | Advanced: 11 test plans (recording exercise, timers incl. Gaussian, pre/post-processors, controllers, config elements, assertions, SOAP, CRUD, mixed-workload load scenario, stepping load), CSV data, monitoring script, and report template. |
| [`Day3/`](Day3) | Reserved for Day 3 material. |

## Quick start
```bash
cd sample-app && node server.js        # http://localhost:3000  (Node 18+, no npm install needed)
cd Day1 && ./run.sh                    # headless run + HTML report in Day1/report
cd Day2 && ./run.sh 08 -Jusers=20      # Day 2 plan by number + HTML report in Day2/results/
jmeter -t Day1/basic-test-plan.jmx     # or open in the GUI
```

## Regression check
Run after **any** change to the app or a test plan:
```bash
./validate.sh    # starts the app on port 3999, runs all plans headless, fails on any failed sample/assertion
```
