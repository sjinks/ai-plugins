# tiny-node-api (fixture)

A minimal HTTP API used to exercise the Code Explorer plugin's expectations. It is intentionally tiny and not production-quality.

## What it contains

- one HTTP route: `GET /greeting?name=...` ([src/routes.js](src/routes.js));
- one service: `buildGreeting` ([src/service.js](src/service.js));
- one config env var: `GREETING_PREFIX` ([src/config.js](src/config.js));
- one test: [test/service.test.js](test/service.test.js);
- one intentionally documented risk: the `name` query parameter is reflected into the response without length limits or sanitization (see `expected/docs/codebase-exploration/10_RISK_REGISTER.md`).

## Run

```bash
node src/server.js
npm test
```
