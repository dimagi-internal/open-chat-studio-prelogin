# Open Chat Studio Pre-Login

Static pre-login website for [Open Chat Studio by Dimagi](https://dimagi.com/).

> **Note:** Near copy of original Dimagi.com website.

## Local development

Open `index.html` directly in a browser, or serve with any static file server.

## Live site

https://openchatstudio.dimagi.com

## Relationship to the OCS app

These pages also live in [open-chat-studio](https://github.com/dimagi/open-chat-studio)
as Django templates under `apps/prelogin`, and the two are kept in sync.

One intentional divergence: the Use Cases page there embeds the demo bots as live
chat widgets, which needs per-bot widget channel tokens from deployment config. Here
the cards link out to the hosted chatbots instead.
