import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://openchatstudio.dimagi.com',

  output: 'static',

  build: {
    // Emit /about/index.html rather than /about.html, so the deployed URLs keep
    // the trailing-slash shape the Django site served and the redirects assume.
    format: 'directory',
  },

  integrations: [
    // sitemap-index.xml + sitemap-0.xml from every emitted route. 404 is not a
    // route Astro lists, so the output is exactly the 5 real pages.
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
});
