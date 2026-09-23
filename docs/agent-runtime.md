# Agent Runtime

## Current state

The research runtime now has a provider-neutral orchestration layer:

1. `/api/scan` accepts a bounded list of domains.
2. Connector adapters run in simulation mode until real provider credentials are configured.
3. Evidence records are normalized through `api/lib/evidence.js`.
4. Opportunity scoring is centralized in `api/lib/scoring.js`.
5. The UI exposes a **Run Agent Research** action and clearly labels simulation mode.
6. CI syntax-checks the API modules.

## Evidence rule

Simulation responses never count as live market evidence. A live provider must supply a real source before a signal can increase opportunity confidence.

## Production sequence

- RDAP / domain registration data
- Licensed comparable-sales provider
- News / company research provider
- Buyer and decision-maker research
- Persistent database
- Scheduled jobs
- Authentication and per-user portfolios

No API keys belong in browser code or the repository. Provider credentials should be supplied through server-side environment variables.
