/**
 * Roman OS v1.2.3 - D1 同步 API (除錯版)
 * 會回傳詳細錯誤，不會只顯示 500
 */

export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 not bound", hasDB: false, envKeys: Object.keys(env) }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    // 檢查表是否存在
    try {
      await env.DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first();
    } catch (e) {
      // 表不存在，自動建表
      if (e.message.includes("no such table")) {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        return new Response(JSON.stringify({ ok: true, autoCreatedTable: true, message: "表已自動建立，請再按一次同步" }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
      }
      throw e;
    }

    const url = new URL(context.request.url);
    const site = url.searchParams.get('site');
    let row;
    if (site) {
      row = await env.DB.prepare("SELECT id, site, raw, updated_at, length(raw) as len FROM roman_data WHERE site=? OR id=? ORDER BY updated_at DESC LIMIT 1").bind(site, site).first();
    } else {
      row = await env.DB.prepare("SELECT id, site, raw, updated_at, length(raw) as len FROM roman_data ORDER BY updated_at DESC LIMIT 1").first();
    }
    const { results: list } = await env.DB.prepare("SELECT id, site, length(raw) as len, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 20").all();
    return new Response(JSON.stringify({ ok: true, current: row, list, hasDB: true }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack, hasDB: !!env.DB }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 not bound - 請到 Pages > Settings > Functions > D1 bindings 綁定 DB" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    // 確保表存在
    try {
      await env.DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first();
    } catch (e) {
      if (e.message.includes("no such table")) {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
      }
    }

    const body = await request.json();
    const raw = body.raw || "";
    const site = body.site || body.id || "default";
    const id = body.id || site;
    if (!raw) return new Response(JSON.stringify({ error: "raw empty - localStorage 沒有 roman_schedule_raw" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

    await env.DB.prepare("INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP").bind(id, raw, site).run();
    return new Response(JSON.stringify({ ok: true, id, site, len: raw.length }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
