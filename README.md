# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## AI opportunity scanner

The opportunity tracking admin includes a configurable Gemini-based source scanner and shortlist workflow.

- Set `GEMINI_API_KEY` in the server or Railway environment. Never expose this value through Vite/client variables.
- `GEMINI_MIN_REQUEST_INTERVAL_MS` controls the minimum delay between Gemini calls. It defaults to `3500` ms to remain below the common 20 requests/minute free-tier limit; paid projects can lower it according to their quota.
- `OPPORTUNITY_SCANNER_ENABLED=true` starts the internal due-source scheduler. It checks every 15 minutes; each source keeps its own scan interval.
- `CRON_SECRET` also protects `GET /api/opportunity-tracking/cron/scan` when an external Railway cron trigger is preferred.
- Models, company/personal profiles, instructions, scoring weights, thresholds, and source intervals are stored in PostgreSQL and managed from the admin screen.
