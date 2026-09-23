# Robot Intelligence — Domain Intelligence Agent

A domain-intelligence workspace for portfolio research, potential-buyer discovery, lead generation, market/news monitoring and evidence-backed opportunities.

## Pilot
**RobotIntelligence.bot** is the first domain analyzed by the platform.

## v0.7 agent foundation
- Portfolio dashboard
- Canonical 22-domain pilot dataset
- Domain search
- Agent status surface
- Buyer, market-signal and opportunity modules
- Extensible data model for future research connectors

## Roadmap
1. Domain intelligence and valuation engine
2. Company/buyer discovery with evidence
3. Decision-maker and lead enrichment
4. News, funding and market monitoring
5. Opportunity detection and alerts
6. Research history, scoring and recommendations
7. Authentication, multi-user workspace and SaaS layer

Scores and recommendations should be explainable and traceable to evidence. The system should distinguish observed facts, inferred signals and model-generated suggestions.

## Security
Research-provider keys and AI credentials must never be committed to the repository. Backend secrets belong in deployment environment variables.


## v0.8 architecture

The project now separates evidence, valuation factors, connector adapters, portfolio metrics, research jobs, opportunities, decision makers, outreach, and agent events. RDAP is the baseline registration-data protocol; production comparable-sales and valuation data require an appropriately licensed provider. API secrets must remain server-side.
