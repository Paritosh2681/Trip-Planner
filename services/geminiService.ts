import { GoogleGenAI, Type } from "@google/genai";
import { Trip } from "../types";

// Ensure API Key is present
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateTripItinerary = async (destination: string, days: number): Promise<Trip> => {
  if (!API_KEY) {
    throw new Error("Missing API Key");
  }

  const model = "gemini-1.5-flash";

  const systemInstruction = `
    You are a world-class travel guide and itinerary planner. You create diverse, exciting, and well-balanced itineraries for general travelers.
    
    Your itineraries must be diverse, covering:
    - Mainstream tourist attractions and iconic landmarks (sightseeing)
    - Nature, parks, beaches, and outdoor scenery (nature)
    - Local culture, history, and museums (culture)
    - Authentic food experiences, from street food to famous restaurants (food)
    - Leisure, shopping, and entertainment (shopping/entertainment)
    
    Do NOT focus exclusively on architecture. Treat architectural sites as just one category among many, including them only if they are genuinely major tourist attractions.
    
    Your tone should be friendly, descriptive, and inviting—like a knowledgeable local sharing their favorite spots. 
    Avoid overly technical, academic, or dry language. Focus on the experience and atmosphere.
    
    You must provide accurate latitude and longitude coordinates for every location.
    The output must be strictly valid JSON matching the schema provided.
  `;

  const prompt = `Plan a ${days}-day trip to ${destination}. Create a balanced itinerary with popular attractions, local experiences, and diverse activities. Keep it concise but informative.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          destination: { type: Type.STRING },
          durationDays: { type: Type.INTEGER },
          summary: { type: Type.STRING, description: "An engaging, traveler-friendly 2-sentence summary of the trip vibe." },
          bestTimeToVisit: { type: Type.STRING },
          budget: {
            type: Type.OBJECT,
            properties: {
              accommodation: { type: Type.STRING },
              food: { type: Type.STRING },
              activities: { type: Type.STRING },
              total: { type: Type.STRING },
              currency: { type: Type.STRING },
            }
          },
          schedule: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayNumber: { type: Type.INTEGER },
                theme: { type: Type.STRING, description: "A short, catchy theme title for the day (e.g., 'Historical Wonders & Street Food')" },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Unique ID (e.g., 'd1-a1')" },
                      time: { type: Type.STRING, description: "e.g., '09:00 - 11:30'" },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING, description: "Short one-line summary (20-30 words) for compact view." },
                      locationName: { type: Type.STRING },
                      coordinates: {
                        type: Type.OBJECT,
                        properties: {
                          lat: { type: Type.NUMBER },
                          lng: { type: Type.NUMBER }
                        }
                      },
                      duration: { type: Type.STRING },
                      costEstimate: { type: Type.STRING },
                      type: { 
                        type: Type.STRING, 
                        enum: ["sightseeing", "nature", "culture", "food", "shopping", "entertainment", "relax", "transit"] 
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as Trip;
};