import { DurableObject } from "cloudflare:workers";

function safeJson(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildChange(previous, next) {
  if (!previous) {
    return {
      changed: true,
      change_types: ["first_seen"],
      score_delta: null,
      previous_score: null
    };
  }

  const changeTypes = [];
  const previousScore = normalizeNumber(previous.opportunityScore);
  const nextScore = normalizeNumber(next.opportunityScore);

  if (previousScore !== nextScore) changeTypes.push("opportunity_score");
  if (previous.priority !== next.priority) changeTypes.push("priority");
  if (Number(previous.evidenceCount || 0) !== Number(next.evidenceCount || 0)) {
    changeTypes.push("evidence_count");
  }
  if (Number(previous.news?.count || 0) !== Number(next.news?.count || 0)) {
    changeTypes.push("news_count");
  }
  if (previous.valuation?.value_state !== next.valuation?.value_state) {
    changeTypes.push("valuation_state");
  }
  if (JSON.stringify((previous.extensionWatch?.registered||[]).map(x=>x.domain).sort()) !== JSON.stringify((next.extensionWatch?.registered||[]).map(x=>x.domain).sort())) {
    changeTypes.push("extension_registration");
  }
  if (previous.rdap?.status !== next.rdap?.status) {
    changeTypes.push("rdap_status");
  }

  return {
    changed: changeTypes.length > 0,
    change_types: changeTypes,
    score_delta:
      previousScore !== null && nextScore !== null
        ? Number((nextScore - previousScore).toFixed(2))
        : null,
    previous_score: previousScore
  };
}

export class AgentMemory extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL,
          kind TEXT NOT NULL,
          payload TEXT NOT NULL
        )
      `);
      this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_memories_created_at
        ON memories(created_at DESC)
      `);
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS domain_state (
          domain TEXT PRIMARY KEY,
          updated_at TEXT NOT NULL,
          payload TEXT NOT NULL,
          first_seen_at TEXT,
          seen_count INTEGER NOT NULL DEFAULT 0
        )
      `);
      try {
        this.ctx.storage.sql.exec("ALTER TABLE domain_state ADD COLUMN first_seen_at TEXT");
      } catch {}
      try {
        this.ctx.storage.sql.exec("ALTER TABLE domain_state ADD COLUMN seen_count INTEGER NOT NULL DEFAULT 0");
      } catch {}
      this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_domain_state_updated_at
        ON domain_state(updated_at DESC)
      `);
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/store") {
      const body = await request.json();
      const kind = String(body.kind || "agent_cycle");
      const payload = JSON.stringify(body.payload ?? {});
      const createdAt = new Date().toISOString();

      this.ctx.storage.sql.exec(
        "INSERT INTO memories (created_at, kind, payload) VALUES (?, ?, ?)",
        createdAt,
        kind,
        payload
      );

      return Response.json({ ok: true, stored_at: createdAt });
    }

    if (request.method === "POST" && url.pathname === "/upsert-domain") {
      const body = await request.json();
      const domain = String(body.domain || "").trim();
      if (!domain) return Response.json({ ok: false, error: "domain_required" }, { status: 400 });

      const next = body.payload ?? {};
      const previousRow = this.ctx.storage.sql.exec(
        "SELECT updated_at, payload, first_seen_at, seen_count FROM domain_state WHERE domain = ?",
        domain
      ).toArray()[0];

      const previous = previousRow ? safeJson(previousRow.payload) : null;
      const change = buildChange(previous, next);
      const updatedAt = new Date().toISOString();
      const firstSeenAt = previousRow?.first_seen_at || updatedAt;
      const seenCount = Number(previousRow?.seen_count || 0) + 1;

      const enrichedPayload = {
        ...next,
        memory: {
          first_seen_at: firstSeenAt,
          last_seen_at: updatedAt,
          seen_count: seenCount,
          changed: change.changed,
          change_types: change.change_types,
          score_delta: change.score_delta,
          previous_score: change.previous_score
        }
      };

      this.ctx.storage.sql.exec(
        "INSERT INTO domain_state (domain, updated_at, payload, first_seen_at, seen_count) VALUES (?, ?, ?, ?, ?) ON CONFLICT(domain) DO UPDATE SET updated_at=excluded.updated_at, payload=excluded.payload, first_seen_at=excluded.first_seen_at, seen_count=excluded.seen_count",
        domain,
        updatedAt,
        JSON.stringify(enrichedPayload),
        firstSeenAt,
        seenCount
      );

      if (change.changed && previousRow) {
        this.ctx.storage.sql.exec(
          "INSERT INTO memories (created_at, kind, payload) VALUES (?, ?, ?)",
          updatedAt,
          "domain_state_changed",
          JSON.stringify({
            domain,
            change_types: change.change_types,
            score_delta: change.score_delta,
            previous_score: change.previous_score,
            opportunity_score: normalizeNumber(next.opportunityScore),
            registered_variants: (next.extensionWatch?.registered||[]).map(x=>x.domain),
            seen_count: seenCount
          })
        );
      }

      const previousVariants=new Set((previous?.extensionWatch?.registered||[]).map(x=>x.domain));
      const newVariants=(next.extensionWatch?.registered||[]).filter(x=>!previousVariants.has(x.domain));
      if (previousRow && previous?.extensionWatch?.watch_version==="iana-all-v1" && newVariants.length) {
        this.ctx.storage.sql.exec(
          "INSERT INTO memories (created_at, kind, payload) VALUES (?, ?, ?)",
          updatedAt,
          "extension_registration_detected",
          JSON.stringify({
            domain,
            variants:newVariants.map(x=>x.domain),
            extensions:newVariants.map(x=>x.tld||x.domain.split(".").at(-1)),
            detected_at:updatedAt,
            source:"RDAP"
          })
        );
      }

      return Response.json({
        ok: true,
        domain,
        updated_at: updatedAt,
        memory: enrichedPayload.memory
      });
    }

    if (request.method === "GET" && url.pathname === "/portfolio") {
      const rows = this.ctx.storage.sql.exec(
        "SELECT domain, updated_at, payload FROM domain_state ORDER BY domain ASC"
      ).toArray();
      return Response.json({
        ok: true,
        count: rows.length,
        domains: rows.map(row => ({
          domain: row.domain,
          updated_at: row.updated_at,
          ...safeJson(row.payload)
        }))
      });
    }

    if (request.method === "GET" && url.pathname === "/recent") {
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 10), 1), 50);
      const rows = this.ctx.storage.sql.exec(
        "SELECT id, created_at, kind, payload FROM memories ORDER BY created_at DESC LIMIT ?",
        limit
      ).toArray();

      return Response.json({
        ok: true,
        count: rows.length,
        memories: rows.map(row => ({
          id: row.id,
          created_at: row.created_at,
          kind: row.kind,
          payload: safeJson(row.payload)
        }))
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}
