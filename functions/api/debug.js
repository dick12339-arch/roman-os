
export async function onRequestGet(context){
  try{
    const DB = context.env.DB;
    if(!DB) return new Response(JSON.stringify({error:"D1 not bound"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){
      await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
      await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
    }
    const romanAll = await DB.prepare("SELECT id, site, length(raw) as len, substr(raw,1,50) as preview, updated_at FROM roman_data ORDER BY updated_at DESC").all();
    const shiftAll = await DB.prepare("SELECT id, length(raw) as len, substr(raw,1,50) as preview, updated_at FROM shift_data ORDER BY updated_at DESC").all();
    return new Response(JSON.stringify({
      ok:true,
      db:"8719bcb8 舊庫",
      roman_count: romanAll.results?.length||0,
      roman_rows: romanAll.results||[],
      shift_count: shiftAll.results?.length||0,
      shift_rows: shiftAll.results||[],
      hint: "如果兩邊 site/id 不同，會有 2 筆，最新的一筆才是 GET /api/roman 回傳的"
    }, null, 2), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
export async function onRequestOptions(){ return new Response(null, {status:204, headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}}); }
