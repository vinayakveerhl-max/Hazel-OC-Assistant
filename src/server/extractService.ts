import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractionDocument {
  client: string;
  project: string;
  reference_number: string;
  oc_date: string;
  total_amount?: string;
  prepared_by?: string;
  notes?: string;
}

export interface ExtractionItem {
  category: string;
  line_item_numbers: string[];
  client_code: string;
  item_name: string;
  full_specification: string;
  wattage: string;
  cct: string;
  beam_angle: string;
  finish: string;
  ip_rating: string;
  length: string;
  driver: string;
  quantity: number;
  unit: string;
  comments: string;
  id?: string;
  cri?: string;
  dimensions?: string;
  profileType?: string;
  powerSupplyType?: string;
  driverType?: string;
  dimming?: string;
  productCode?: string;
  remarks?: string;
  originalDescription?: string;
  lineItemNumber?: string;
  itemName?: string;
  clientCode?: string;
  beamAngle?: string;
  ipRating?: string;
}

export interface ExtractionResponse {
  success: boolean;
  document: ExtractionDocument;
  items: ExtractionItem[];
  header?: {
    customerName: string;
    projectName: string;
    ocNumber: string;
    ocDate: string;
    referenceNumber: string;
    totalAmount?: string;
    preparedBy?: string;
    notes?: string;
  };
  modelUsed?: string;
  error?: string;
  code?: string;
  details?: string;
}

// Helper to sanitize extracted strings and strip OCR/footer noise
function cleanText(val: any): string {
  if (!val) return '';
  let str = String(val).trim();
  
  // Strip URLs (e.g. letstranzact.com)
  str = str.replace(/https?:\/\/[^\s]+/gi, '');
  // Strip metadata & bank headers if present in strings
  str = str.replace(/(GSTIN|Bank Details|Kotak Mahindra|Authorised Signatory|Page \d+ of \d+)[^\n]*/gi, '');
  // Fix repeating string loops (e.g., 8W8W8W...)
  str = str.replace(/(8W){2,}/gi, '8W');
  
  return str.replace(/\s+/g, ' ').trim();
}

// Clean wattage specifically to prevent loop artifacts
function cleanWattage(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/\b\d+(\.\d+)?\s*W\b/i);
  if (match) {
    return match[0].toUpperCase().replace(/\s+/, '');
  }
  return str.replace(/(8W){2,}/gi, '8W').trim();
}

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

export async function processPdfExtraction(
  inputPayload: any,
  filename: string = 'document.pdf'
): Promise<ExtractionResponse> {
  let rawString = typeof inputPayload === 'string' 
    ? inputPayload 
    : inputPayload?.pdfBase64 || inputPayload?.data || inputPayload?.base64 || '';

  const cleanBase64 = String(rawString).replace(/^data:application\/pdf;base64,/, '').trim();

  if (!cleanBase64) {
    throw new Error('No valid base64 PDF data supplied in request.');
  }

  const ai = getGenAI();

  // Strict prompt to stop raw OCR/footer leakage
  const extractionPrompt = `You are a high-precision Lighting Order Confirmation (OC) Document Intelligence Engine.
Extract all line items and header details from this document.

STRICT INSTRUCTIONS:
1. Ignore page footers, payment terms, bank account details, GSTIN, tax breakdowns, vendor legal terms, or system URLs (e.g., letstranzact.com).
2. Do NOT inject raw document footer text into full_specification or comments.
3. Keep specifications, wattage (e.g., 8W), CCT, beam angle, and finish clean and concise. Do NOT repeat wattage values multiple times.
4. Return strictly valid JSON adhering to the provided schema.`;

  const pdfPart = {
    inlineData: {
      mimeType: 'application/pdf',
      data: cleanBase64,
    },
  };

  // Modern, valid Gemini models
  const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const BACKOFF_MS = [2000, 4000, 8000];

  let responseText: string | undefined;
  let usedModel = '';
  let lastGeminiError: any = null;

  for (let m = 0; m < MODELS_TO_TRY.length; m++) {
    const modelName = MODELS_TO_TRY[m];

    for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [pdfPart, { text: extractionPrompt }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                success: { type: Type.BOOLEAN },
                document: {
                  type: Type.OBJECT,
                  properties: {
                    client: { type: Type.STRING },
                    project: { type: Type.STRING },
                    reference_number: { type: Type.STRING },
                    oc_date: { type: Type.STRING },
                    total_amount: { type: Type.STRING },
                    prepared_by: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ['client', 'project', 'reference_number', 'oc_date'],
                },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      line_item_numbers: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      client_code: { type: Type.STRING },
                      item_name: { type: Type.STRING },
                      full_specification: { type: Type.STRING },
                      wattage: { type: Type.STRING },
                      cct: { type: Type.STRING },
                      beam_angle: { type: Type.STRING },
                      finish: { type: Type.STRING },
                      ip_rating: { type: Type.STRING },
                      length: { type: Type.STRING },
                      driver: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      comments: { type: Type.STRING },
                    },
                    required: ['category', 'line_item_numbers', 'item_name', 'quantity', 'unit'],
                  },
                },
              },
              required: ['document', 'items'],
            },
          },
        });

        responseText = response.text;
        usedModel = modelName;
        break;
      } catch (err: any) {
        lastGeminiError = err;
        const errMsg = err.message || String(err);
        const status = err.status || err.statusCode || 500;

        const isRetryable =
          status === 503 ||
          status === 429 ||
          errMsg.toLowerCase().includes('503') ||
          errMsg.toLowerCase().includes('unavailable') ||
          errMsg.toLowerCase().includes('resource_exhausted') ||
          errMsg.toLowerCase().includes('rate limit');

        if (!isRetryable || attempt >= BACKOFF_MS.length) {
          break;
        }

        const delay = BACKOFF_MS[attempt];
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (responseText) {
      break;
    }
  }

  if (!responseText) {
    throw new Error(lastGeminiError?.message || 'Gemini API failed to process the PDF.');
  }

  const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  const document: ExtractionDocument = {
    client: cleanText(parsed.document?.client),
    project: cleanText(parsed.document?.project),
    reference_number: cleanText(parsed.document?.reference_number),
    oc_date: cleanText(parsed.document?.oc_date),
    total_amount: cleanText(parsed.document?.total_amount),
    prepared_by: cleanText(parsed.document?.prepared_by),
    notes: cleanText(parsed.document?.notes),
  };

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];

  const items: ExtractionItem[] = rawItems.map((item: any, idx: number) => {
    const lineNums = Array.isArray(item.line_item_numbers) ? item.line_item_numbers : [String(idx + 1)];
    const lineNumStr = lineNums.join(', ');
    
    const rawWattage = cleanWattage(item.wattage);
    const rawSpec = cleanText(item.full_specification || item.item_name || '');
    const rawClientCode = cleanText(item.client_code);
    const rawItemName = cleanText(item.item_name);
    const rawCategory = cleanText(item.category) || 'Other Lighting Products';
    const rawComments = cleanText(item.comments);

    return {
      id: `oc-item-${Date.now()}-${idx + 1}`,
      category: rawCategory,
      line_item_numbers: lineNums,
      lineItemNumber: lineNumStr,
      client_code: rawClientCode,
      clientCode: rawClientCode || '—',
      item_name: rawItemName || 'Lighting Fixture',
      itemName: rawItemName || 'Lighting Fixture',
      productCode: rawClientCode || '—',
      full_specification: rawSpec,
      wattage: rawWattage,
      cct: cleanText(item.cct),
      beam_angle: cleanText(item.beam_angle),
      beamAngle: cleanText(item.beam_angle) || '—',
      finish: cleanText(item.finish),
      ip_rating: cleanText(item.ip_rating),
      ipRating: cleanText(item.ip_rating) || '—',
      length: cleanText(item.length),
      dimensions: cleanText(item.length) || '—',
      profileType: rawCategory === 'Profiles' ? rawItemName : '—',
      powerSupplyType: rawCategory === 'Power Supplies' ? cleanText(item.driver || item.item_name) : '—',
      driver: cleanText(item.driver),
      driverType: cleanText(item.driver) || '—',
      dimming: item.driver?.toLowerCase().includes('dali') ? 'DALI' : item.driver?.toLowerCase().includes('dim') ? 'Dimmable' : 'Non-Dim',
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      unit: cleanText(item.unit) || 'Nos',
      comments: rawComments,
      remarks: rawComments || '—',
      originalDescription: rawSpec,
      cri: '',
    };
  });

  const header = {
    customerName: document.client || 'Customer',
    projectName: document.project || 'Lighting Project',
    ocNumber: document.reference_number || 'OC-' + Date.now().toString().slice(-6),
    ocDate: document.oc_date || new Date().toLocaleDateString(),
    referenceNumber: document.reference_number || '—',
    totalAmount: document.total_amount || '—',
    preparedBy: document.prepared_by || '—',
    notes: document.notes || '—',
  };

  return {
    success: true,
    document,
    items,
    header,
    modelUsed: usedModel,
  };
}
