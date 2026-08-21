import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processPdfExtraction } from '../src/server/extractService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await processPdfExtraction(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Extraction Error:', error);
    return res.status(500).json({ 
      error: error?.message || 'Extraction failed',
      details: String(error)
    });
  }
}
