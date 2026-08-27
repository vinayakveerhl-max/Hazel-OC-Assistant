import { GoogleGenAI, Type, Schema } from '@google/genai';
import { OCHeader, OCLineItem } from '../types';

// Initialize Gemini API client using key from environment variables
const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  process.env.REACT_APP_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

const ai = new GoogleGenAI({ apiKey });

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
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a Hazel Lighting Order Confirmation extraction engine. Extract all metadata into header fields and split all products into detailed line items categorized under: 'Power Supplies', 'Linears', 'Downlights / Spotlights', 'Profiles', 'Grids', 'Diffusers', or 'Connectors'.\n\nRaw OC Document:\n${inputText}`,
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

    return {
      header: parsedData.header || {},
      items: parsedData.items || [],
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
