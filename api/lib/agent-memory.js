import { DurableObject } from "cloudflare:workers";

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
          payload: JSON.parse(row.payload)
        }))
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}
