import type { Request, Response } from 'express';
import { processPdfExtraction } from '../src/server/extractService';

/**
 * Serverless / API Route handler for /api/extract
 * Always forces response headers to application/json and catches errors
 */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Please send a POST request with pdfBase64.`,
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const { pdfBase64, filename } = req.body || {};
    const originalFilename = filename || 'document.pdf';

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
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
    console.error('[API /api/extract] Extraction failure:', err);
    const status = err.message?.includes('503') ? 503 : err.message?.includes('429') ? 429 : 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'An error occurred while processing the PDF document.',
      code: status === 503 ? 'MODEL_503_UNAVAILABLE' : 'EXTRACTION_ERROR',
      details: String(err),
    });
  }
}
