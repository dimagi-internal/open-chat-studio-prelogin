// Cloudflare Workers entry point.
//
// Serves the static site in ./dist through the ASSETS binding, which still
// honors _redirects, _headers, html_handling and the 404 page. The Worker adds
// exactly one thing on top: search-engine indexing control via X-Robots-Tag.
//
// Only the production hostname is ever indexable, and only once ALLOW_INDEXING
// is "true" (wrangler.jsonc `vars`). Every other host — the *.workers.dev URL
// and the per-branch Workers Builds preview URLs — is noindexed permanently, so
// previews never compete with production for the same content.
const PROD_HOST = "openchatstudio.dimagi.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const res = await env.ASSETS.fetch(request);

    if (url.hostname === PROD_HOST && env.ALLOW_INDEXING === "true") {
      return res;
    }

    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    return out;
  },
};
