import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://cybermark01.github.io',
  prefetch: { prefetchAll: true },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
