
export async function onRequestGet(context){
  try{
    const DB = context.env.DB;
    if(!DB) return new Response(JSON.stringify({error:"D1 not bound - 請檢查 Pages Settings > Functions > D1 bindings 名稱必須是 DB", hasDB:false}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    // 建表
    try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){ await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); }
    let row = null;
    try{ row = await DB.prepare("SELECT id, site, length(raw) as len, raw, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 1").first(); }catch(e){}
    let count = 0;
    try{ const c = await DB.prepare("SELECT COUNT(*) as cnt FROM roman_data").first(); count = c.cnt; }catch(e){}
    return new Response(JSON.stringify({ok:true, hasDB:true, count, current: row, raw_text: row?.raw||"", site: row?.site||"太原", db:"8719bcb8"}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){ return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
}
export async function onRequestPost(context){
  try{
    const DB = context.env.DB;
    if(!DB) return new Response(JSON.stringify({error:"D1 not bound"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){ await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); }
    const body = await context.request.json();
    const raw = body.raw || body.raw_text || "";
    const site = body.site || body.id || "太原";
    const id = body.id || site;
    const isShift = context.request.url.includes("schedule") || context.request.url.includes("shift");
    if(isShift){
      await DB.prepare("INSERT INTO shift_data (id, raw, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, updated_at=CURRENT_TIMESTAMP").bind(id, raw).run();
    }else{
      await DB.prepare("INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP").bind(id, raw, site).run();
    }
    return new Response(JSON.stringify({ok:true, id, site, len: raw.length}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){ return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
}
export async function onRequestOptions(){ return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}}); }
