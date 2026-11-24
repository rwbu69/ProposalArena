import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';
import { loadEnv } from 'vite';
import aiHandler from './api/ai.ts';
import sttHandler from './api/stt.ts';
import ttsHandler from './api/tts.ts';

// Ensure all environment variables from .env are populated into process.env for local dev serverless handlers
const loadedEnv = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
for (const [k, v] of Object.entries(loadedEnv)) {
  if (v) {
    process.env[k] = v;
  }
}

function devApiMiddleware() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/ai' || url === '/api/stt' || url === '/api/tts') {
          let bodyData = '';
          req.on('data', chunk => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              const body = bodyData ? JSON.parse(bodyData) : {};
              const reqLike = {
                method: req.method,
                headers: req.headers,
                body
              };
              const resLike = {
                statusCode: 200,
                status(code) {
                  this.statusCode = code;
                  return this;
                },
                setHeader(name, val) {
                  res.setHeader(name, val);
                  return this;
                },
                json(val) {
                  res.statusCode = this.statusCode || 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(val));
                }
              };
              if (url === '/api/ai') {
                await aiHandler(reqLike, resLike);
              } else if (url === '/api/stt') {
                await sttHandler(reqLike, resLike);
              } else if (url === '/api/tts') {
                await ttsHandler(reqLike, resLike);
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: 'static',
  vite: {
    optimizeDeps: {
      include: ['minisearch', 'marked', 'uuid']
    },
    plugins: [devApiMiddleware()]
  }
});

