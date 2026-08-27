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
  // UI helper fields
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

function normalizeSpec(val: any): string {
  return String(val || '').trim().toLowerCase();
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

  console.log(`[Hazel OC] PDF received: "${filename}" (~${Math.round((cleanBase64.length * 0.75) / 1024)} KB)`);

  const ai = getGenAI();

  const extractionPrompt = `You are a high-precision Lighting Order Confirmation (OC) Document Intelligence Engine.
You are given the ORIGINAL multi-page Order Confirmation (OC) PDF document ("${filename}").

CORE EXTRACTION MANDATES:
1. PROCESS ENTIRE PDF: Inspect all pages, line items, itemized tables, notes, and totals visually and structurally.
2. EXTRACT EVERY MATERIAL from the OC, including:
   - Downlights & Spotlights (COB, Modular, Fixed, Adjustable, Surface, Trimless)
   - Linears (Recessed, Surface, Suspended, Continuous, Battens)
   - Svelte fixtures and linear systems
   - Flexum LED strips and Neon flex
   - Profiles & Extrusions (Aluminum channels, Trimless, Flanged)
   - Power supplies / drivers (Meanwell, Tridonic, Constant Voltage 24V, Constant Current, Phase-Cut, DALI)
   - Connectors, joiners, end caps, power feeds
   - Grids, louvers, baffles, optics
   - Opal diffusers, prismatic diffusers, lenses
   - Accessories, suspension kits, mounting brackets
   - Any other lighting-related material or line item appearing anywhere in the OC.

3. FOR EVERY LINE ITEM CAPTURE:
   - line_item_numbers: Array of original OC line item number strings (e.g. ["1"], ["2.1"], ["5", "12"])
   - client_code: Client tag or code (e.g. "DL-01", "LIN-COVE", "PSU-03"). Empty string if absent.
   - item_name: Luminaire model name or product title.
   - full_specification: Complete technical summary string including all dimensions, optics, and electrical specs.
   - wattage: Wattage (e.g. "15W", "24W/m", "50W"). Empty string if absent.
   - cct: Color temperature (e.g. "3000K", "4000K", "Tuneable White"). Empty string if absent.
   - beam_angle: Beam angle (e.g. "15°", "24°", "36°", "120°"). Empty string if absent.
   - finish: Color or body finish (e.g. "Matt Black", "White", "Anodized Silver"). Empty string if absent.
   - ip_rating: IP Rating (e.g. "IP20", "IP44", "IP65"). Empty string if absent.
   - length: Length or cutout/dimension (e.g. "1200mm", "2.5 Mtr", "Dia 85mm Cutout 75mm"). Empty string if absent.
   - driver: Driver brand, model, dimming protocol, or PSU spec (e.g. "Meanwell HLG-150H-24V Non-Dim", "DALI-2 Driver Included"). Empty string if absent.
   - quantity: Numeric quantity (number).
   - unit: Unit of measure (e.g. "Nos", "Mtrs", "Sets", "Pcs").
   - comments: Mounting notes, special requests, or line remarks. Empty string if absent.
   - category: One of "Power Supplies", "Linears", "Downlights / Spotlights", "Profiles", "Grids", "Diffusers", "Connectors", "Accessories / Other Items", "Flexum", "Svelte", "Other Lighting Products".

4. CONSOLIDATION RULE:
   Group items with identical technical specifications together across different client codes into single consolidated summaries where applicable.

5. ACCURACY:
   Do NOT hallucinate values. If a field is not present in the OC, return an empty string "".

Return the final result strictly as a valid JSON object matching the requested schema.`;

  const pdfPart = {
    inlineData: {
      mimeType: 'application/pdf',
      data: cleanBase64,
    },
  };

  const MODELS_TO_TRY = ['gemini-3.6-flash', 'gemini-3.6-pro'];
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

  const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*
