/**
 * Roman OS v1.2.1 - D1 同步 API (雙向)
 * GET /api/roman -> 載入最新
 * POST /api/roman -> 同步到 D1
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 not bound" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    const url = new URL(request.url);
    const site = url.searchParams.get('site');
    
    let query;
    if (site) {
      query = env.DB.prepare("SELECT id, site, raw, updated_at FROM roman_data WHERE site=?1 OR id=?1 ORDER BY updated_at DESC LIMIT 1").bind(site);
    } else {
      query = env.DB.prepare("SELECT id, site, raw, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 1");
    }
    const result = await query.first();
    
    // 也回傳列表方便 debug
    const { results: list } = await env.DB.prepare("SELECT id, site, length(raw) as len, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 20").all();
    
    return new Response(JSON.stringify({ current: result, list }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return new Response(JSON.stringify({ error: "D1 not bound" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    const body = await request.json();
    const raw = body.raw || "";
    const site = body.site || body.id || "default";
    const id = body.id || site;
    if (!raw) return new Response(JSON.stringify({ error: "raw empty" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    
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
