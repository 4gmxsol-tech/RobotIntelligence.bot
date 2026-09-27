# RobotIntelligence.bot Agent

The Agent Console is a browser-executable, reversible research operator.

## State machine
UNDERSTAND -> PLAN -> SEARCH -> VERIFY -> DECIDE -> EXECUTE -> TEST -> COMMIT -> DONE

If validation fails, the agent restores the last checkpoint and retries with a revised query. Browser mode does not perform external side effects.

## Tools
GitHub public search, Hacker News public search, normalization, candidate gating, deterministic validation, checkpoint and rollback. Every adapter returns a structured result and failed adapters do not crash the full loop.

## Memory
State is stored locally under robotintelligence.agent.v1. Goals, run summaries, decisions, evidence and checkpoints are persisted. No secrets are stored.

## Execution boundary
Search, analysis, local state mutation, validation and rollback are automatic. Outreach, publishing, purchasing, deleting external resources and secret-bearing operations remain gated until a server/worker executor exists.

## Codex Tasks
A connected Codex Tasks environment can later host this same state machine with filesystem execution and tests. The current console does not claim a remote Codex runtime when none is connected.
