// Site-wide constants. Everything that used to come from Django settings or a
// `{% url %}` reverse lives here.
//
// ⚠️ The app host belongs in APP_URL and nowhere else. It is a different host
// from this site (see docs/MIGRATION_PLAN.md), so a hardcoded copy in a page is
// a link that silently rots the next time the app moves — which has already
// happened once: the pages this site was ported from still pointed at
// chatbots.dimagi.com, retired in favour of www.openchatstudio.com.

/** The Open Chat Studio app. Different host from this marketing site. */
export const APP_URL = 'https://www.openchatstudio.com';

/** The app's login page — every "Sign In" CTA on this site. */
export const LOGIN_URL = `${APP_URL}/accounts/login/`;

export const GITHUB_URL = 'https://github.com/dimagi/open-chat-studio';
export const DOCS_URL = 'https://docs.openchatstudio.com/';

/** Shown on the contact page, alongside the HubSpot form. */
export const CONTACT_EMAIL = 'ocs-info@dimagi.com';

// HubSpot contact form embed (v2). Previously HUBSPOT_FORM_* in Django settings.
export const HUBSPOT_FORM_REGION = 'na1';
export const HUBSPOT_FORM_PORTAL_ID = '503070';
export const HUBSPOT_FORM_ID = 'ab84dc67-539d-40d3-b9ac-466d8b8348bf';

// Legal links in the footer. Previously project_meta.* in Django settings. The
// Django footer wrapped these in {% if %} guards so the span disappeared when
// they were unset; committed as constants, that conditional has no purpose and
// the three links render unconditionally.
export const PRIVACY_POLICY_URL = 'https://dimagi.com/terms-privacy/';
export const TERMS_URL = 'https://dimagi.com/terms-of-service/';
export const ACCEPTABLE_USE_POLICY_URL = 'https://dimagi.com/terms-aup/';

// The chat widget that drives the demo bots on /applications/. Django resolved
// this through `{% widget_script_url %}`, which reads LATEST_VERSION from
// apps/channels/widget_versions.py; here it is pinned by hand, so bump it when
// that constant moves and a new widget release is wanted on this site.
export const WIDGET_VERSION = '0.12.0';
export const WIDGET_SCRIPT_URL =
  `https://unpkg.com/open-chat-studio-widget@${WIDGET_VERSION}` +
  '/dist/open-chat-studio-widget/open-chat-studio-widget.esm.js';

/** Which nav item renders as current. Pages pass this to BaseLayout. */
export type NavKey = 'home' | 'applications' | 'about' | 'contact';

export const NAV_LINKS: { key: NavKey; label: string; href: string }[] = [
  { key: 'home', label: 'Open Chat Studio', href: '/' },
  { key: 'applications', label: 'Use Cases', href: '/applications/' },
  { key: 'about', label: 'Community', href: '/about/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
];
