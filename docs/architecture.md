# Robot Intelligence architecture

## Runtime split

- Public UI: static HTML/CSS/JS.
- Research API: server-side /api functions.
- Evidence layer: live claims require source, observed_at and confidence.
- Agent memory: event-based lifecycle.
- Research jobs: queued work is separated from UI rendering.

GitHub Pages is static hosting, so server-side research must run on a separate runtime. The repository keeps the UI deployable on Pages while the API layer is compatible with a serverless Node runtime.

## Production path

1. Connect RDAP.
2. Connect a licensed comparable-sales provider.
3. Connect news/search.
4. Connect company and decision-maker data.
5. Persist jobs and events in a database.
6. Add scheduled workers.
7. Add authentication and per-user portfolios.

## Security

Never expose provider API keys in app.js, JSON data, or HTML. Store credentials as server-side environment variables.