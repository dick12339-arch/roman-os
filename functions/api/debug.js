
export async function onRequestGet(context){
  const url = new URL(context.request.url);
  const clean = url.searchParams.get('clean');
  try{
    const DB = context.env.DB;
    if(!DB) return new Response(JSON.stringify({error:"D1 not bound"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    try{ await DB.prepare("SELECT 1 FROM roman_data LIMIT 1").first(); }catch(e){
      await DB.prepare("CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
      await DB.prepare("CREATE TABLE IF NOT EXISTS shift_data (id TEXT PRIMARY KEY, raw TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
    }
    let cleaned = null;
    if(clean === '1'){
      // 把 shift_data 裡面那筆長度 1357 的羅曼資料刪掉（因為同仁班表不應該有 9/26 這種）
      const del = await DB.prepare("DELETE FROM shift_data WHERE id='shift_main'").run();
      cleaned = del;
    }
    const romanAll = await DB.prepare("SELECT id, site, length(raw) as len, substr(raw,1,80) as preview, updated_at FROM roman_data ORDER BY updated_at DESC").all();
    const shiftAll = await DB.prepare("SELECT id, length(raw) as len, substr(raw,1,80) as preview, updated_at FROM shift_data ORDER BY updated_at DESC").all();
    return new Response(JSON.stringify({
      ok:true,
      db:"8719bcb8 舊庫",
      cleaned: cleaned ? "已刪除 shift_main (那筆寫錯的羅曼資料)" : "未清理，加 ?clean=1 才會刪",
      roman_count: romanAll.results?.length||0,
      roman_rows: romanAll.results||[],
      shift_count: shiftAll.results?.length||0,
      shift_rows: shiftAll.results||[],
      next_step: "清完後 shift_count 應該變 0，roman_count 維持 1，兩邊再按 從 D1 載入 就會互通"
    }, null, 2), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
export async function onRequestOptions(){ return new Response(null, {status:204, headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization"}}); }
