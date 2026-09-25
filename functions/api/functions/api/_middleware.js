export async function onRequest(context) {
  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}
