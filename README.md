# Open Chat Studio Pre-Login

Static pre-login website for [Open Chat Studio by Dimagi](https://dimagi.com/).

> **Note:** Near copy of original Dimagi.com website.

## Local development

Install dependencies once with `npm install`, then use one of:

- `npm run dev` starts the Astro dev server at http://localhost:4321 and reloads
  on change. Use it for editing pages. It does not apply `public/_redirects` or
  `public/_headers`, and unknown paths show Astro's 404 rather than ours.
- `npm run preview` builds the site and serves it with `wrangler dev` at
  http://localhost:8787, the same Cloudflare setup used in production. Use it to
  check redirects, headers and the 404 page, e.g.
  `curl -sI http://localhost:8787/contact/` should return a 301 to `/`.

`npm run build` type-checks and builds into `dist/`.

## Live site

https://openchatstudio.dimagi.com

## Relationship to the OCS app

These pages also live in [open-chat-studio](https://github.com/dimagi/open-chat-studio)
as Django templates under `apps/prelogin`, and the two are kept in sync.

One intentional divergence: the Use Cases page there embeds the demo bots as live
chat widgets, which needs per-bot widget channel tokens from deployment config. Here
the cards link out to the hosted chatbots instead.
