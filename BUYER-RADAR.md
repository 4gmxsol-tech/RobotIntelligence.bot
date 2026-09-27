# Buyer Radar

Buyer Radar is the agentic research layer for RobotIntelligence.bot.

## MVP
- Domain asset + research query input
- Buyer matching dashboard
- Five-tool architecture
- Demo dataset isolated from production integrations

## Production adapters
The production agent will connect to five external tools selected from cporter202/agentic-ai-apis:
1. Discovery/search
2. Web extraction
3. Company/entity intelligence
4. News/signals
5. LLM/reasoning

Secrets must be supplied through a server/worker environment and never committed to this repository.

## Production flow
asset -> discovery -> evidence extraction -> signals -> entity matching -> structured buyer brief -> human-reviewed outreach

## Current status
The browser UI intentionally runs in DEMO MODE. GitHub Pages is static, so provider API secrets must be kept behind a server/worker endpoint. The next production layer is a narrow /api/radar endpoint that owns credentials and returns normalized buyer records.