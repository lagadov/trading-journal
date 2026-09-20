import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createQuoteMiddleware } from './server/marketQuotes.js'

function marketQuotes() {
  let middleware;
  return {
    name: 'market-quotes',
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, 'MASSIVE_');
      middleware = createQuoteMiddleware({ apiKey: env.MASSIVE_API_KEY });
    },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), marketQuotes()],
})
