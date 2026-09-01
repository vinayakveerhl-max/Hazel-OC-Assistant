import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { processPdfExtraction } from './src/server/extractService';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 50MB for large multi-page PDF base64 transfer
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Logging middleware for all API requests
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      const start = Date.now();
      console.log(`[API REQUEST] ${req.method} ${req.originalUrl} | Content-Type: ${req.headers['content-type'] || 'none'}`);
      res.on('finish', () => {
        console.log(`[API RESPONSE] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Content-Type: ${res.getHeader('Content-Type')} | ${Date.now() - start}ms`);
      });
    }
    next();
  });

  // 1. Health & Status endpoint - ALWAYS returns JSON
  app.get('/api/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({
      success: true,
      ok: true,
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Primary Server-Side Extraction Route (handles both /api/extract-oc and /api/extract)
  const handleExtractRequest = async (req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
      const { pdfBase64, filename } = req.body || {};
      const originalFilename = filename || 'document.pdf';

      if (!pdfBase64 || typeof pdfBase64 !== 'string') {
        console.warn('[API Extraction] Missing pdfBase64 in request body');
        return res.status(400).json({
          success: false,
          error: 'No PDF data received. Please provide valid base64-encoded PDF data.',
          code: 'MISSING_PDF_PAYLOAD',
        });
      }

      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

      const result = await processPdfExtraction(cleanBase64, originalFilename);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[Hazel OC] Error in extraction handler:', err);
      const status = err.message?.includes('503') ? 503 : err.message?.includes('429') ? 429 : 500;
      return res.status(status).json({
        success: false,
        error: err.message || 'Gemini extraction failed.',
        code: status === 503 ? 'MODEL_503_UNAVAILABLE' : 'EXTRACTION_ERROR',
        details: String(err),
      });
    }
  };

  app.post('/api/extract-oc', handleExtractRequest);
  app.post('/api/extract', handleExtractRequest);

  // 3. Catch-all for any unmatched /api/* routes - GUARANTEES JSON (NEVER falls through to Vite HTML)
  app.all('/api/*', (req, res) => {
    console.warn(`[API 404] Route not found: ${req.method} ${req.originalUrl}`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // 4. Vite middleware for frontend SPA in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Guard: Only pass non-API requests to Vite
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hazel OC Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
