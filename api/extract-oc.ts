import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processPdfExtraction } from '../src/server/extractService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Please use POST with PDF data.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // String body could be raw base64 or plain string
      }
    }

    const result = await processPdfExtraction(body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API /api/extract-oc] Extraction Error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Extraction failed',
      details: String(error),
    });
  }
}
