// import { defineConfig } from 'astro/config';
// import node from '@astrojs/node';
// import tailwind from '@astrojs/tailwind';

// export default defineConfig({
//   output: 'hybrid',
//   adapter: node({
//     mode: 'standalone'
//   }),
//   integrations: [tailwind()],
//   server: {
//     port: 3000,
//     headers: {
//       'Access-Control-Allow-Origin': '*'
//     }
//   },
//   vite: {
//     server: {
//       // Increase limits for large file uploads
//       hmr: {
//         clientPort: 3000
//       },
//       watch: {
//         usePolling: false
//       }
//     },
//     build: {
//       // Increase chunk size warning limit
//       chunkSizeWarningLimit: 2000
//     }
//   }
// });

import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind()],
  vite: {
    server: {
      hmr: {
        clientPort: 3000
      },
      watch: {
        usePolling: false
      }
    },
    build: {
      chunkSizeWarningLimit: 2000
    }
  }
});