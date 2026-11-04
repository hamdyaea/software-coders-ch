// Hamdy Abou El Anein — info@software-coders.ch
// Canonical public URLs; preview hosts keep their existing noindex policy.
const HOST = "software-coders.ch";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === HOST || url.hostname === "www." + HOST) {
      const target = new URL(url);
      target.protocol = "https:";
      target.hostname = HOST;
      target.port = "";
      if (target.pathname.endsWith("/index.html")) {
        target.pathname = target.pathname.slice(0, -"index.html".length);
      }
      if (target.href !== url.href) {
        return new Response(null, {
          status: 301,
          headers: {
            Location: target.href,
            "Cache-Control": "public, max-age=300",
            "X-Content-Type-Options": "nosniff"
          }
        });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
