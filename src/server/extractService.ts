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
  // Extract base64 safely regardless of body format
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

4. STRICT CONSOLIDATION RULE:
   Only consolidate two items if their COMPLETE relevant specification is 100% identical.
   NEVER merge:
   - different wattages
   - different CCTs
   - different beam angles
   - different lengths
   - different finishes
   - different IP ratings
   - different driver specifications
   - different profiles
   - different product variants
   If the exact same specification appears multiple times across the OC, combine the numeric quantities and preserve all corresponding OC line item numbers in line_item_numbers array.

5. ACCURACY:
   Do NOT hallucinate values. If a field is not present in the OC, return an empty string "".

Return the final result strictly as a valid JSON object matching the requested schema.`;

  const pdfPart = {
    inlineData: {
      mimeType: 'application/pdf',
      data: cleanBase64,
    },
  };

  const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
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
    client: parsed.document?.client || '',
    project: parsed.document?.project || '',
    reference_number: parsed.document?.reference_number || '',
    oc_date: parsed.document?.oc_date || '',
    total_amount: parsed.document?.total_amount || '',
    prepared_by: parsed.document?.prepared_by || '',
    notes: parsed.document?.notes || '',
  };

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items: ExtractionItem[] = rawItems.map((item: any, idx: number) => {
    const lineNums = Array.isArray(item.line_item_numbers)
      ? item.line_item_numbers.map((n: any) => String(n))
      : [String(item.line_item_numbers || idx + 1)];
    const lineNumStr = lineNums.join(', ');

    return {
      id: `oc-item-${Date.now()}-${idx + 1}`,
      category: item.category || 'Other Lighting Products',
      line_item_numbers: lineNums,
      lineItemNumber: lineNumStr,
      client_code: item.client_code || '',
      clientCode: item.client_code || '—',
      item_name: item.item_name || 'Lighting Fixture',
      itemName: item.item_name || 'Lighting Fixture',
      productCode: item.productCode || item.client_code || '—',
      full_specification: item.full_specification || item.item_name || '',
      wattage: item.wattage || '',
      cct: item.cct || '',
      beam_angle: item.beam_angle || '',
      beamAngle: item.beam_angle || '—',
      finish: item.finish || '',
      ip_rating: item.ip_rating || '',
      ipRating: item.ip_rating || '—',
      length: item.length || '',
      dimensions: item.length || '—',
      profileType: item.category === 'Profiles' ? item.item_name : '—',
      powerSupplyType: item.category === 'Power Supplies' ? (item.driver || item.item_name) : '—',
      driver: item.driver || '',
      driverType: item.driver || '—',
      dimming: item.driver?.toLowerCase().includes('dali') ? 'DALI' : item.driver?.toLowerCase().includes('dim') ? 'Dimmable' : 'Non-Dim',
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      unit: item.unit || 'Nos',
      comments: item.comments || '',
      remarks: item.comments || '—',
      originalDescription: item.full_specification || item.item_name || '',
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
