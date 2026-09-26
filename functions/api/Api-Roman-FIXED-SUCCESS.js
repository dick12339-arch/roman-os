
export async function onRequestGet(context){
  try{
    const DB = context.env.DB;
    if(!DB) return new Response(JSON.stringify({error:"D1 not bound", success:false}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}});
    try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){ await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); }
    const url = new URL(context.request.url);
    const isSchedule = url.pathname.includes("schedule") || url.pathname.includes("shift");
    let row = null;
    if(isSchedule){
      row = await DB.prepare("SELECT id, raw, updated_at FROM shift_data ORDER BY updated_at DESC LIMIT 1").first().catch(()=>null);
    }else{
      row = await DB.prepare("SELECT id, site, raw, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 1").first().catch(()=>null);
    }
    const raw = row?.raw || "";
    return new Response(JSON.stringify({
      ok:true,
      success:true,
      raw_text: raw,
      raw: raw,
      site: row?.site||"太原",
      id: row?.id||"太原",
      len: raw.length,
      hasDB:true,
      current: row ? {raw: raw, raw_text: raw, site: row?.site, id: row?.id, len: raw.length} : null
    }), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message, success:false}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
export async function onRequestPost(context){
  try{
    const DB = context.env.DB;
    if(!DB) return new Response(JSON.stringify({error:"D1 not bound", success:false}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){ await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); }
    const body = await context.request.json();
    const raw = body.raw || body.raw_text || "";
    if(!raw || raw.length<2) return new Response(JSON.stringify({error:"raw empty", success:false}), {status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    const isShift = context.request.url.includes("schedule") || context.request.url.includes("shift");
    const site = body.site || body.id || (isShift ? "shift_main" : "太原");
    const id = body.id || site;
    if(isShift){
      await DB.prepare("INSERT INTO shift_data (id, raw, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, updated_at=CURRENT_TIMESTAMP").bind(id, raw).run();
    }else{
      await DB.prepare("INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP").bind(id, raw, site).run();
    }
    return new Response(JSON.stringify({
      ok:true,
      success:true,
      id, site,
      len: raw.length,
      raw_text: raw,
      raw: raw
    }), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message, success:false}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
export async function onRequestOptions(){
  return new Response(null, {status:204, headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Max-Age":"86400"}});
}
