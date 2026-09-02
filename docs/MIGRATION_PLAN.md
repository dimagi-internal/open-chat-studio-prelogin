# Migration plan: OCS pre-login site → Astro on Cloudflare Workers

**Status:** proposed, not started.
**Reference implementation:** `../commcare-website` (Astro + Cloudflare Workers, same
Dimagi Cloudflare account, same publishing workflow).

## End state

| Thing | Today | After |
|---|---|---|
| Marketing pages | Django templates in `open-chat-studio` (`apps/prelogin`), mirrored as static HTML in this repo, published to GitHub Pages | Astro site in **this repo**, deployed to Cloudflare Workers at **`openchatstudio.dimagi.com`** |
| OCS app root (`/`) | Full marketing home page | Simple landing page (logo, one-line pitch, Sign In, links out to the marketing site / docs / GitHub) |
| Other marketing URLs on the app host | Real pages | `301` → `openchatstudio.dimagi.com/<same path>` |
| Auth pages (login/signup/reset) | Extend `prelogin/auth_base.html` → `prelogin/base.html` | Unchanged look; the shared frame stays in OCS with nav/footer links pointing at the marketing site |
| Two copies of every page | Yes, kept in sync by hand | One copy, here |

**Sign In on the marketing site** links to the app's login page on the app host.

## Decisions already made

- Marketing host: `openchatstudio.dimagi.com`. The app keeps its current host — no
  app-side DNS change, no allauth/SSO callback churn.
- OCS keeps a **simple landing page** at `/`, not a copy of the marketing home.
- The Use Cases page ships the **live demo-bot chat widgets** (the richer OCS version),
  with bot ids and embed keys **baked in at build time**. These keys are already served
  to every browser that loads the page, so committing them changes nothing
  security-wise — but see the `allowed_domains` item in Phase 0, which does matter.
- Tooling carried over from `commcare-website`: Astro + wrangler + `@astrojs/sitemap`,
  `public/_headers` (security + cache policy), `public/_redirects`, Git LFS for binary
  assets, and `worker.js` for the noindex kill-switch on preview hosts. The heavier
  build guards there (asset-size gate, HubSpot form-id gate, critical-CSS inlining) are
  **deferred** — they earn their keep on a 150-page site, not a 6-page one.

## Current state, for reference

**This repo** (6 pages, ~9.8k lines of HTML, 22 images, 1.3 MB):

```
index.html  about/  applications/  contact/  open-opportunities/  platform/  404.html
assets/styles.css (6471 lines)   assets/ocs-theme.css (537)   assets/images/*
```

`platform/index.html` is a 21-line meta-refresh stub redirecting to `/#how-it-works`.

**`open-chat-studio`**: `apps/prelogin/{views,urls}.py`, `templates/prelogin/*.html`
(7 files, 2559 lines), `static/prelogin/{styles,ocs-theme}.css` + `images/`.
The CSS and images are **byte-identical** to this repo's — the sync is real, so either
side can be the source of truth for those.

The Django templates are the better **content** source: same copy as here, plus the
widget version of the Use Cases page.

---

## Phase 0 — prerequisites and things to collect

Nothing here is code; all of it blocks a working deploy.

1. **Cloudflare project.** In the Dimagi Cloudflare account, create a Worker (suggested
   name `ocs-prelogin`) and connect **Workers Builds** to
   `dimagi-internal/open-chat-studio-prelogin`, so PRs get isolated preview deployments
   and `main` ships to production. Mirrors `commcare-prelogin`.
2. **DNS.** `dimagi.com` is already a Cloudflare zone (it serves `commcare.dimagi.com`),
   so `openchatstudio.dimagi.com` is a custom-domain binding on the Worker, not a
   registrar change.
3. ~~**Demo bot config.**~~ **Done** — the production `PRELOGIN_DEMO_BOTS` values are
   committed at `src/data/demo-bots.json` (`nanibot`, `fp_coach`, `program_dashboard`).
   They map to the Use Cases cards as: `nanibot` → *Maternal Health*, `fp_coach` →
   *Worker Coaching*, `program_dashboard` → *Program Data* (confirmed against the bot ids
   in today's `applications/index.html`). Re-pull from SSM only if a bot is replaced.
4. **⚠️ Widget `allowed_domains`.** Each demo bot's widget channel validates the request
   `Origin` against `extra_data.allowed_domains`
   (`apps/channels/utils.py:validate_domain`, enforced in `apps/api/authentication.py`).
   The page is same-origin with the API today, so this has never mattered. Served from
   `openchatstudio.dimagi.com` it does: **add that host to each demo bot's widget channel
   allowed domains** (plus the `*.workers.dev` preview host, or the widgets will be dead
   on every preview build). Do this before the cut-over — it is the one step most likely
   to be missed and it fails as a silent, page-specific breakage.
5. **Node 22.12+** locally.

## Phase 1 — Astro scaffold in this repo

Layout mirrors `commcare-website` so the two sites stay navigable by the same people.

```
package.json           dev / build / preview / deploy scripts
astro.config.mjs       site: 'https://openchatstudio.dimagi.com', output static, format directory, sitemap()
wrangler.jsonc         name, assets.directory ./dist, not_found_handling 404-page, ALLOW_INDEXING var
worker.js              noindex everything except the production hostname
.gitattributes         png/jpg/jpeg/webp/avif/pdf/mp4 → Git LFS
.gitignore             + node_modules, dist/, .astro/, .wrangler
src/
  layouts/BaseLayout.astro    <head> + Nav + Footer + slots (head / scripts)
  components/Nav.astro        logo, 4 links, GitHub + Sign In CTAs, hamburger + its script
  components/Footer.astro     4-column footer + legal links
  consts.ts                   APP_URL, GITHUB_URL, DOCS_URL, HUBSPOT_*, nav model
  data/demo-bots.json         already written (Phase 0.3)
  styles/                     styles.css + ocs-theme.css, moved verbatim
  pages/                      index / about / applications / contact / open-opportunities / 404
public/
  assets/images/*             moved verbatim from assets/images/
  _headers                    security headers + cache policy (trimmed from commcare's)
  _redirects                  /platform/ → /#how-it-works  (301)
  robots.txt
```

Two deliberate deviations from `commcare-website`: the existing `styles.css` /
`ocs-theme.css` move across **unchanged** (this is a port, not a restyle — a rewrite onto
a token system is a separate project), and there is no `scripts/` directory.

## Phase 2 — port the pages

Source: `open-chat-studio/templates/prelogin/*.html`. The conversion is mechanical:

| Django | Astro |
|---|---|
| `{% extends "prelogin/base.html" %}` | `<BaseLayout title=… description=… activeNav=…>` |
| `{% static 'prelogin/images/x' %}` | `/assets/images/x` |
| `{% url 'prelogin:about' %}` | `/about/` |
| `{% url 'sso:login' %}` | `` `${APP_URL}/accounts/login/` `` |
| `{% block page_styles %}` | `<style is:global slot="head">` |
| `{% block page_scripts %}` | `<script is:inline slot="scripts">` |
| `{% block meta %}` (per-page og/JSON-LD) | `BaseLayout` props: `description`, `ogImage`, `jsonLd` |
| `{% if demo_bots.nanibot %}` | `demoBots.nanibot` from `src/data/demo-bots.json` |
| `{{ project_meta.* }}` legal URLs | constants in `src/consts.ts` (values below) |
| `{% widget_script_url %}` | pinned `unpkg.com/open-chat-studio-widget@<version>` URL in `consts.ts` |

The footer's legal links, read from settings in Django, are these in production and
become constants in `src/consts.ts`:

```
PRIVACY_POLICY_URL       https://dimagi.com/terms-privacy/
TERMS_URL                https://dimagi.com/terms-of-service/
ACCEPTABLE_USE_POLICY_URL  https://dimagi.com/terms-aup/
```

Django's footer wraps them in `{% if %}` guards so the whole span disappears when they're
unset. That conditional has no purpose once the values are committed — render the three
links unconditionally rather than porting the guards.

Per page:

- **`index.astro`** ← `home.html`. Carries the Organization / WebSite / SoftwareApplication
  JSON-LD. Keep the `#how-it-works` anchor — `/platform/` redirects to it.
- **`about/index.astro`** ← `about.html`.
- **`applications/index.astro`** ← `applications.html`, **widget version**. The three bot
  cards become interactive when their key is present in `demo-bots.json`; the
  card-opens-widget script ports as-is. Keep the "for demonstration and research purposes
  only" banner attributes.
- **`contact/index.astro`** ← `contact.html`. HubSpot embed v2, portal `503070`, form
  `ab84dc67-539d-40d3-b9ac-466d8b8348bf` (already hardcoded in this repo's contact page).
  Keep the "Loading form…" fallback and the mailto fallback.
- **`open-opportunities/index.astro`** ← `open_opportunities.html`. Not in the nav; linked
  from the footer and from `/about/`.
- **`404.astro`** ← this repo's `404.html`.

**Content fixes to make during the port** (both existing copies are stale):

- `applications/index.html` links to `chatbots.dimagi.com/...` — the old app domain. Point
  every app link at the current app host via `APP_URL`.
- `og:url` / canonical say `https://dimagi.com/open-chat-studio/`. `BaseLayout` should
  derive both from the route under `openchatstudio.dimagi.com` (commcare's BaseLayout does
  exactly this) so no page can drift again.
- `og:image` values are relative in this repo; they must be absolute URLs.

Verify each page against a local `npm run dev` and the current live page side by side.

## Phase 3 — deploy and preview

1. `npm run build` green, `npm run preview` (build + `wrangler dev`) serves the site.
2. Open a PR; confirm Workers Builds produces a per-branch preview URL.
3. Confirm on the preview: `X-Robots-Tag: noindex` present (Worker), the security and
   cache headers from `_headers` present, `/platform/` 301s, an unknown path serves the
   404 page, and the demo-bot widgets open (requires Phase 0.4 to include the preview host).
4. Merge to `main`, bind `openchatstudio.dimagi.com`, flip `ALLOW_INDEXING` to `"true"`.

## Phase 4 — cut-over

1. Point `openchatstudio.dimagi.com` at the Worker; verify TLS and that the production
   host is *not* noindexed while every other host still is.
2. Retire GitHub Pages for this repo (the README's
   `dimagi-internal.github.io/open-chat-studio-prelogin/` URL goes away).
3. Add the 301s on the app host — see Phase 5.
4. Submit the new host in Google Search Console; keep the old URLs redirecting
   indefinitely, not for a fixed window.

## Phase 5 — teardown in `open-chat-studio`

Deliberately **after** the new site is live, as its own PR.

Keep `apps/prelogin` — the name is still accurate and it keeps every `prelogin:*` reverse
name working, which matters because `apps/sso/views.py:123`,
`templates/account/logout.html` and `apps/teams/tests/test_teams_middleware.py` all use
them. The app shrinks to a landing page plus redirects.

**Change:**

- `apps/prelogin/views.py` — `home()` keeps its authenticated-user branch (team →
  dashboard, no team → create team) and renders a new `prelogin/landing.html` for
  anonymous users. Delete `applications()`, `contact()`, `_configured_demo_bots()`.
- `apps/prelogin/urls.py` — `/about/`, `/applications/`, `/contact/`,
  `/open-opportunities/` become permanent `RedirectView`s to
  `https://openchatstudio.dimagi.com/<path>/`; `/platform/` redirects there too (the
  marketing site then sends it on to `/#how-it-works`) — or, better, straight to
  `https://openchatstudio.dimagi.com/#how-it-works` to avoid a redirect chain.
- `templates/prelogin/landing.html` — new, small: logo, one-line pitch, Sign In, and
  outbound links to the marketing site, docs and GitHub.
- `templates/prelogin/base.html` — nav and footer links now absolute URLs into the
  marketing site. Keep the frame, the CSS links, the skip link and the hamburger script.
- `templates/prelogin/auth_base.html` — unchanged.
- **Delete:** `templates/prelogin/{home,about,applications,contact,open_opportunities}.html`.
- **Delete:** the `static/prelogin/images/*` no longer referenced — everything except
  `ocs-logo.png` and `ocs-favicon.png`. Keep both CSS files (the auth pages and the
  landing page depend on them; trimming them is a separate, optional cleanup).
- `apps/web/sitemaps.py` — `StaticViewSitemap.items()` drops to `["prelogin:home"]`.
- `apps/prelogin/tests/test_views.py` — rewrite: landing page renders for anonymous,
  authenticated still redirects to dashboard, each retired path 301s to the right external
  URL, sitemap lists one entry. Delete the demo-bot and HubSpot tests.
- **Settings:** remove `PRELOGIN_CONTACT_EMAIL`, `HUBSPOT_FORM_REGION`,
  `HUBSPOT_FORM_PORTAL_ID`, `HUBSPOT_FORM_ID`, `PRELOGIN_DEMO_BOTS` from
  `config/settings.py` and `.env.example`.
- **`ocs-deploy`:** remove the same four names from `ocs_deploy/config.py` (lines ~102,
  304–307) and `.env.example`, and remove the SSM parameters once the app no longer reads
  them. Sequence it after the OCS PR ships, so a deploy never reads a parameter that
  vanished mid-flight.

## Phase 6 — docs and handover

- Rewrite this repo's `README.md` on the `commcare-website` model: a marketing-team
  "getting started" path (GitHub account, git, Git LFS, Node, Claude Code, `gh`) and a
  developer quick reference. Drop the "kept in sync with `apps/prelogin`" section — that
  divergence is what this migration ends.
- Add a `CLAUDE.md`: where pages live, the Astro conventions, the publishing workflow, and
  the guardrails that actually bite here (don't restyle shared components without
  sign-off; don't break the demo-bot `allowed_domains` contract; don't hardcode the app
  host outside `consts.ts`).
- Update `open-chat-studio`'s own docs if they point at the pre-login pages.

---

## Verification checklist

- [ ] All 6 pages render identically to the current live pages (desktop + mobile).
- [ ] Nav/footer links resolve; Sign In lands on the app login page.
- [ ] `/platform/` 301s to `/#how-it-works`; unknown paths serve the 404 page.
- [ ] Demo-bot widgets open from all three cards on production **and** on a preview URL.
- [ ] HubSpot form loads and submits; fallback appears when the script is blocked.
- [ ] Canonical + `og:url` on every page point at `openchatstudio.dimagi.com`.
- [ ] `sitemap-index.xml` lists exactly the 5 real pages.
- [ ] Production host indexable; `*.workers.dev` and preview hosts noindexed.
- [ ] Security + cache headers present.
- [ ] Old app-host marketing URLs 301 to the new site with no chains.
- [ ] `/` on the app host: landing page for anonymous, dashboard for signed-in.
- [ ] OCS auth pages (login, signup, both password-reset flows) still look right.
- [ ] Lighthouse mobile ≥ the current site's scores.

## Risks and open items

- **Widget `allowed_domains`** (Phase 0.4) is the one true cross-repo coupling. Miss it
  and the Use Cases page looks fine while every bot silently refuses to open.
- **Embed keys in the repo.** Accepted: they already ship to every browser. Two
  consequences worth naming. Rotation becomes a code change here rather than a config
  change (move them to a Cloudflare build env var later if that grates). And the widget
  channel's `allowed_domains` check is now the *only* thing scoping a leaked key to our
  pages — which makes Phase 0.4 a security control, not just a wiring step. Do not set
  `allowed_domains` to `*` on these channels as a shortcut when a preview URL misbehaves.
- **Two-copy window.** Between Phase 4 and Phase 5 both sites are live and diverging.
  Keep it to days, and freeze content edits in OCS during it.
- **`styles.css` is 6.5k lines** carried over from dimagi.com, largely unused here. Left
  as-is on purpose; a trim (or critical-CSS inlining, deferred from Phase 1) is the obvious
  follow-up performance win.
- **Search-ranking dip** is normal on a host move. The 301s and a Search Console
  change-of-address are the mitigation.
