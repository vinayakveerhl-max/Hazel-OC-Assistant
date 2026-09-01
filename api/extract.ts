import type { Request, Response } from 'express';
import { processPdfExtraction } from '../src/server/extractService';

/**
 * Serverless / API Route handler for /api/extract
 * Always forces response headers to application/json and catches errors
 */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Please send a POST request with pdfBase64.`,
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // body may be raw base64 string
      }
    }

    const result = await processPdfExtraction(body);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API /api/extract] Extraction failure:', err);
    const errorMsg =
      typeof err === 'string'
        ? err
        : err?.message ||
          (typeof err === 'object' ? JSON.stringify(err) : String(err));
    const status = errorMsg.includes('503') ? 503 : errorMsg.includes('429') ? 429 : 500;
    return res.status(status).json({
      success: false,
      error: errorMsg || 'An error occurred while processing the PDF document.',
      code: status === 503 ? 'MODEL_503_UNAVAILABLE' : 'EXTRACTION_ERROR',
      details: typeof err?.stack === 'string' ? err.stack : String(err),
    });
  }
}
