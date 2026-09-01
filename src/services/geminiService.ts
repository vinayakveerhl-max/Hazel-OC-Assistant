import { GoogleGenAI, Type, Schema } from '@google/genai';
import { OCHeader, OCLineItem } from '../types';

// Initialize Gemini API client using key from environment variables
const apiKey =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  '';

const ai = new GoogleGenAI({ apiKey });

// Helper function to sanitize extracted text fields
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

// Clean wattage specifically to avoid duplication bugs
function cleanWattage(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/\b\d+(\.\d+)?\s*W\b/i);
  if (match) {
    return match[0].toUpperCase().replace(/\s+/, '');
  }
  return str.replace(/(8W){2,}/gi, '8W').trim();
}

// Define JSON Schema for structured OC extraction output
const ocSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    header: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING },
        projectName: { type: Type.STRING },
        ocNumber: { type: Type.STRING },
        ocDate: { type: Type.STRING },
        referenceNumber: { type: Type.STRING },
        preparedBy: { type: Type.STRING },
      },
      required: ['ocNumber', 'projectName'],
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lineItemNumber: { type: Type.STRING },
          clientCode: { type: Type.STRING },
          productCode: { type: Type.STRING },
          itemName: { type: Type.STRING },
          category: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          wattage: { type: Type.STRING },
          cct: { type: Type.STRING },
          cri: { type: Type.STRING },
          beamAngle: { type: Type.STRING },
          finish: { type: Type.STRING },
          ipRating: { type: Type.STRING },
          length: { type: Type.STRING },
          dimensions: { type: Type.STRING },
          driverType: { type: Type.STRING },
          powerSupplyType: { type: Type.STRING },
          dimming: { type: Type.STRING },
          profileType: { type: Type.STRING },
          remarks: { type: Type.STRING },
          originalDescription: { type: Type.STRING },
        },
        required: ['itemName', 'quantity', 'category'],
      },
    },
  },
  required: ['header', 'items'],
};

export async function processOCWithGemini(
  inputText: string
): Promise<{ header: OCHeader; items: OCLineItem[] }> {
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please check your environment configuration.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a Hazel Lighting Order Confirmation extraction engine. 
Extract all metadata into header fields and split all products into detailed line items categorized under: 'Power Supplies', 'Linears', 'Downlights / Spotlights', 'Profiles', 'Grids', 'Diffusers', or 'Connectors'.

STRICT RULES:
1. Ignore page footers, bank details, GSTIN, payment terms, or system URLs (e.g. letstranzact.com).
2. Keep wattage (e.g. 8W), CCT, beam angle, and finish clean and concise. Do NOT repeat wattage values multiple times.
3. Extract clean product line items only.

Raw OC Document:
${inputText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ocSchema,
        temperature: 0.1,
      },
    });

    const outputText = response.text || '{}';
    const parsedData = JSON.parse(outputText);

    // Post-process header strings
    const rawHeader = parsedData.header || {};
    const header: OCHeader = {
      ...rawHeader,
      customerName: cleanText(rawHeader.customerName),
      projectName: cleanText(rawHeader.projectName),
      ocNumber: cleanText(rawHeader.ocNumber),
      ocDate: cleanText(rawHeader.ocDate),
      referenceNumber: cleanText(rawHeader.referenceNumber),
      preparedBy: cleanText(rawHeader.preparedBy),
    };

    // Post-process and sanitize item fields
    const rawItems = Array.isArray(parsedData.items) ? parsedData.items : [];
    const items: OCLineItem[] = rawItems.map((item: any) => ({
      ...item,
      lineItemNumber: cleanText(item.lineItemNumber),
      clientCode: cleanText(item.clientCode),
      productCode: cleanText(item.productCode),
      itemName: cleanText(item.itemName),
      category: cleanText(item.category),
      unit: cleanText(item.unit) || 'Nos',
      wattage: cleanWattage(item.wattage),
      cct: cleanText(item.cct),
      cri: cleanText(item.cri),
      beamAngle: cleanText(item.beamAngle),
      finish: cleanText(item.finish),
      ipRating: cleanText(item.ipRating),
      length: cleanText(item.length),
      dimensions: cleanText(item.dimensions),
      driverType: cleanText(item.driverType),
      powerSupplyType: cleanText(item.powerSupplyType),
      dimming: cleanText(item.dimming),
      profileType: cleanText(item.profileType),
      remarks: cleanText(item.remarks),
      originalDescription: cleanText(item.originalDescription),
    }));

    return {
      header,
      items,
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
