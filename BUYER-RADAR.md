# Buyer Radar

Buyer Radar is a public-signal research aid within RobotIntelligence.bot. It helps a human researcher discover robotics-related organizations and inspect the public evidence behind each candidate.

## Current browser implementation

- Asset and research-query inputs.
- Live search against the **GitHub public repository search API** and **Hacker News search through Algolia**.
- Source-linked signal cards with dates and descriptions returned by those public endpoints.
- Heuristic entity resolution, signal classification, and research-priority scoring.
- A human-reviewed research angle; the interface does not send messages or contact companies.

## Important limits

- GitHub repository metadata and Hacker News stories are the only live discovery sources currently wired into the browser implementation.
- Organization matching is heuristic. A candidate label is **not independent company verification**.
- Signal classification and research-priority scores are heuristics. A high score is **not a probability of purchase, acquisition intent, budget, or willingness to buy**.
- Public activity can indicate technical or market relevance without indicating any commercial need.
- The tool does not currently query Crunchbase, Product Hunt, LinkedIn, company registries, CRM systems, paid enrichment providers, or a verified buyer-intent feed.
- The tool does not verify asset ownership, sale authorization, current availability, or transfer scope. Those must be checked in the authoritative asset register.
- The current static browser implementation uses public endpoints directly and has no server-side provider credentials. External rate limits, CORS policy, and source availability can affect a scan.

## Research workflow

1. Enter an asset and a focused market query.
2. Review the linked GitHub or Hacker News source for each signal.
3. Verify the organization's legal identity, current activity, decision-maker, and commercial need using authoritative sources.
4. Treat suggested roles and scores as research prioritization only.
5. Check the asset's ownership, sale authorization, and transfer scope independently.
6. Obtain legal and suppression clearance before any outreach. Buyer Radar itself never sends outreach.

## Future production work

A future server-side integration could add official company sources, funding/news feeds, company/entity enrichment, and normalized evidence records. Any credentials must remain in a protected server or Worker environment and must never be committed to this repository. Until those integrations exist, do not describe the browser tool as a five-provider production agent or verified buyer database.
