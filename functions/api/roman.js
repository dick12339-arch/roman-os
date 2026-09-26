
export async function onRequestGet(context){
  const { env } = context;
  try{
    if(!env.DB) return new Response(JSON.stringify({error:"D1 not bound"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    const DB = env.DB;
    let tables = [];
    let debug = {};
    try{
      const {results} = await DB.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
      tables = results;
      for(let t of results){
        try{
          const c = await DB.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).first();
          debug[t.name] = c.cnt;
        }catch(e){ debug[t.name] = "error: "+e.message; }
      }
    }catch(e){ debug.error = e.message; }

    // 試著讀 roman_data
    let row = null;
    try{
      row = await DB.prepare("SELECT id, site, length(raw) as len, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 1").first();
    }catch(e){}

    // 也試著讀可能存在的舊表名
    let alt = {};
    for(let name of ["schedules","roman","roman_schedule","data","shift_data"]){
      try{
        const r = await DB.prepare(`SELECT COUNT(*) as cnt FROM "${name}"`).first();
        alt[name] = r.cnt;
      }catch(e){}
    }

    return new Response(JSON.stringify({
      ok:true,
      db_id:"8719bcb8-10e9-4f6e-b6c4-54ccf5a36a91",
      tables,
      counts: debug,
      alt_tables: alt,
      current_roman_data: row,
      current_shift: await DB.prepare("SELECT id, length(raw) as len, updated_at FROM shift_data ORDER BY updated_at DESC LIMIT 1").first().catch(()=>null),
      hasDB:true,
      raw_text: row?.raw||"",
      site: row?.site||"太原",
      list: await DB.prepare("SELECT id, site, length(raw) as len, updated_at FROM roman_data ORDER BY updated_at DESC LIMIT 20").all().then(r=>r.results).catch(()=>[]),
      message: row ? `有資料 ${row.len}字` : "0筆 - 舊庫是空的，需要按一次 💾 同步到 D1 才會有資料"
    }), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message, stack:e.stack?.slice(0,800)}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
export async function onRequestPost(context){
  const { request, env } = context;
  try{
    if(!env.DB) return new Response(JSON.stringify({error:"D1 not bound"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    const body = await request.json();
    const raw = body.raw || body.raw_text || "";
    const site = body.site || body.id || "太原";
    const id = body.id || site;
    if(!raw) return new Response(JSON.stringify({error:"raw empty"}), {status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    // 確保表存在
    try{ await env.DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){ await env.DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run(); }
    await env.DB.prepare("INSERT INTO roman_data (id, raw, site, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET raw=?2, site=?3, updated_at=CURRENT_TIMESTAMP").bind(id, raw, site).run();
    return new Response(JSON.stringify({ok:true, id, site, len: raw.length, saved_to:"8719bcb8", message:"已寫入舊庫，現在應該不是0筆了"}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){ return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
}
export async function onRequestOptions(){ return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}}); }
