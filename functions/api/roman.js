
async function ensureTable(DB){
  if(!DB) return;
  try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }
  catch(e){
    if(e.message && e.message.includes("no such table")){
      await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
      await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
    }
  }
}
export async function onRequestGet(context){
  const { env, request } = context;
  try{
    const DB = env.DB; const OLD_DB = env.OLD_DB;
    if(!DB && !OLD_DB) return new Response(JSON.stringify({error:"D1 not bound"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    if(DB) await ensureTable(DB); if(OLD_DB) await ensureTable(OLD_DB);
    const url = new URL(request.url); const site = url.searchParams.get('site');
    const isSchedule = url.pathname.includes("schedule") || url.pathname.includes("shift");
    let row=null; let source="none";
    if(DB){
      try{
        if(isSchedule) row = await DB.prepare("SELECT id, raw, updated_at, length(raw) as len FROM shift_data ORDER BY updated_at DESC LIMIT 1").first();
        else {
          if(site) row = await DB.prepare("SELECT id, site, raw, updated_at, length(raw) as len FROM roman_data WHERE site=? OR id=? ORDER BY updated_at DESC LIMIT 1").bind(site, site).first();
          else row = await DB.prepare("SELECT id, site, raw, updated_at, length(raw) as len FROM roman_data ORDER BY updated_at DESC LIMIT 1").first();
        }
        if(row) source="new_db";
      }catch(e){}
    }
    if(!row && OLD_DB){
      try{
        if(isSchedule) row = await OLD_DB.prepare("SELECT id, raw, updated_at, length(raw) as len FROM shift_data ORDER BY updated_at DESC LIMIT 1").first();
        else {
          if(site) row = await OLD_DB.prepare("SELECT id, site, raw, updated_at, length(raw) as len FROM roman_data WHERE site=? OR id=? ORDER BY updated_at DESC LIMIT 1").bind(site, site).first();
          else row = await OLD_DB.prepare("SELECT id, site, raw, updated_at, length(raw) as len FROM roman_data ORDER BY updated_at DESC LIMIT 1").first();
        }
        if(row){ source="old_db"; if(DB && !isSchedule){ try{ await DB.prepare("INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP").bind(row.id, row.raw, row.site||site||'太原').run(); }catch(e){} } }
      }catch(e){}
    }
    let list=[]; if(DB){ try{ const {results}=await DB.prepare("SELECT id, site, length(raw) as len, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 20").all(); list=results; }catch(e){} }
    return new Response(JSON.stringify({ok:true, current: row, list, hasDB: !!DB, hasOldDB: !!OLD_DB, source, raw_text: row?.raw||"", raw: row?.raw||"", site: row?.site||site||"太原"}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){ return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
}
export async function onRequestPost(context){
  const { request, env } = context;
  try{
    const DB = env.DB; if(!DB) return new Response(JSON.stringify({error:"新 D1 (DB) 未綁定"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    await ensureTable(DB);
    const url = new URL(request.url); const isSchedule = url.pathname.includes("schedule") || url.pathname.includes("shift");
    const body = await request.json(); const raw = body.raw || body.raw_text || "";
    if(!raw) return new Response(JSON.stringify({error:"raw empty"}), {status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    if(isSchedule){ const id = body.id || "shift_main"; await DB.prepare("INSERT INTO shift_data (id, raw, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, updated_at=CURRENT_TIMESTAMP").bind(id, raw).run(); return new Response(JSON.stringify({ok:true, id, len: raw.length, raw_text: raw, target:"new_db"}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
    const site = body.site || body.id || "default"; const id = body.id || site;
    await DB.prepare("INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP").bind(id, raw, site).run();
    return new Response(JSON.stringify({ok:true, id, site, len: raw.length, raw_text: raw, target:"new_db"}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){ return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
}
export async function onRequestOptions(){ return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}}); }
