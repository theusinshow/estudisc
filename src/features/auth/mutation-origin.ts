export function isAllowedMutationOrigin(headers:Headers,url:URL,appUrl?:string){
  if(headers.get("sec-fetch-site")==="cross-site")return false;
  const origin=headers.get("origin");if(!origin)return true;
  const allowed=new Set([url.origin]);
  if(appUrl)allowed.add(new URL(appUrl).origin);
  // Next's development URL can normalize 127.0.0.1 to localhost. Host retains the actual browser destination.
  const host=headers.get("host");if(host)allowed.add(`${url.protocol}//${host}`);
  return allowed.has(origin);
}
