
export async function onRequestGet(){
  return new Response(JSON.stringify({ok:true, test:"functions working", db:"8719bcb8", time:new Date().toISOString()}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
export async function onRequestPost(c){ return onRequestGet(c); }
export async function onRequestOptions(){ return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}}); }
