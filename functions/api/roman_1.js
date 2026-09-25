/**
 * Roman OS - D1 同步 API v1.2
 * 對應: 羅曼資料區 (roman-schedule) -> D1 roman_data 表
 * 路由: /api/roman (GET, POST)
 */

export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 not bound. 請檢查 wrangler.toml database_id" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const { results } = await env.DB.prepare(
      "SELECT id, site, substr(raw,1,200) as raw_preview, length(raw) as raw_len, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 50"
    ).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 not bound" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    const body = await request.json();
    const raw = body.raw || "";
    const site = body.site || body.id || "default";
    const id = body.id || site;

    if (!raw) {
      return new Response(JSON.stringify({ error: "raw empty" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    // 寫入或更新
    await env.DB.prepare(
      `INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP`
    ).bind(id, raw, site).run();

    return new Response(JSON.stringify({ ok: true, id, site, len: raw.length }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
