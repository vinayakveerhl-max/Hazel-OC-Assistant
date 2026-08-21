import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { processPdfExtraction } from './src/server/extractService';

function apiPlugin(): Plugin {
  return {
    name: 'hazel-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';

        if (url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            ok: true,
            status: 'ok',
            hasApiKey: Boolean(process.env.GEMINI_API_KEY),
            timestamp: new Date().toISOString(),
          }));
          return;
        }

        if (url === '/api/extract-oc' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            try {
              const parsed = JSON.parse(body || '{}');
              const { pdfBase64, filename } = parsed;
              if (!pdfBase64 || typeof pdfBase64 !== 'string') {
                res.statusCode = 400;
                res.end(JSON.stringify({
                  success: false,
                  error: 'No PDF data received. Please provide valid base64-encoded PDF data.',
                  code: 'MISSING_PDF_PAYLOAD',
                }));
                return;
              }

              const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
              const result = await processPdfExtraction(cleanBase64, filename || 'document.pdf');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('[Hazel OC Vite Plugin] Error in /api/extract-oc:', err);
              const status = err.message?.includes('503') ? 503 : err.message?.includes('429') ? 429 : 500;
              res.statusCode = status;
              res.end(JSON.stringify({
                success: false,
                error: err.message || 'Gemini extraction failed.',
                code: status === 503 ? 'MODEL_503_UNAVAILABLE' : 'EXTRACTION_ERROR',
                details: String(err),
              }));
            }
          });
          return;
        }

        if (url.startsWith('/api/')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 404;
          res.end(JSON.stringify({
            success: false,
            error: `API route not found: ${req.method} ${url}`,
            code: 'ROUTE_NOT_FOUND',
          }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
