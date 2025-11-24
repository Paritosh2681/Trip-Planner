import { GoogleGenAI, Type } from "@google/genai";
import { Trip } from "../types";

// Ensure API Key is present
const API_KEY = process.env.API_KEY || '';
console.log('Service API_KEY check:', { 
  hasKey: !!API_KEY, 
  length: API_KEY?.length,
  firstChars: API_KEY?.substring(0, 10)
});

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateTripItinerary = async (destination: string, days: number): Promise<Trip> => {
  if (!API_KEY) {
    console.error('API Key is missing!');
    throw new Error("Missing API Key");
  }

  const model = "gemini-2.5-flash";

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
    
    ⚠️ CRITICAL COORDINATE REQUIREMENTS ⚠️
    You MUST provide HIGHLY ACCURATE GPS coordinates with AT LEAST 6-8 decimal places for EVERY location:
    - Use the EXACT coordinates of the main entrance or center point of each specific place
    - Do NOT use city-center coordinates or approximate locations
    - Do NOT reuse the same coordinates for different locations
    - Verify each coordinate corresponds to the actual physical location
    - Format: {lat: XX.XXXXXXXX, lng: XX.XXXXXXXX}
    
    Examples of CORRECT coordinates:
    - Taj Mahal: {lat: 27.17500600, lng: 78.04215500}
    - Eiffel Tower: {lat: 48.85837009, lng: 2.29447746}
    - Statue of Liberty: {lat: 40.68924500, lng: -74.04450040}
    - Sydney Opera House: {lat: -33.85678200, lng: 151.21529800}
    
    INCORRECT (too vague): {lat: 27.17, lng: 78.04} or {lat: 27.175, lng: 78.042}
    
    Each location MUST have unique, precise coordinates.
    
    ⚠️ OPENING HOURS REQUIREMENT ⚠️
    You MUST provide accurate opening hours for EVERY location. Research and include:
    - Actual operating hours for museums, attractions, restaurants, shops
    - Day-specific hours if they vary (e.g., "Mon-Fri: 9 AM - 6 PM, Sat-Sun: 10 AM - 8 PM")
    - Closed days (e.g., "Closed on Mondays")
    - For outdoor/public spaces: "Open 24/7" or "Dawn to dusk"
    - For restaurants: Include lunch/dinner hours or "Open daily: 11 AM - 11 PM"
    
    The output must be strictly valid JSON matching the schema provided.
  `;

  const prompt = `Plan a ${days}-day trip to ${destination}. Create a balanced itinerary with popular attractions, local experiences, and diverse activities. Include detailed information for each location including opening hours, ticket prices, full descriptions, and practical details. Keep descriptions engaging but informative.`;

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
                          lat: { type: Type.NUMBER, description: "HIGHLY PRECISE latitude with 6-8 decimal places (e.g., 27.17500600). Must be exact GPS coordinates of the specific location, not city center." },
                          lng: { type: Type.NUMBER, description: "HIGHLY PRECISE longitude with 6-8 decimal places (e.g., 78.04215500). Must be exact GPS coordinates of the specific location, not city center." }
                        },
                        description: "CRITICAL: Must be EXACT GPS coordinates of the location's main entrance or center point with 6-8 decimal precision. Each location must have unique coordinates."
                      },
                      duration: { type: Type.STRING },
                      costEstimate: { type: Type.STRING },
                      type: { 
                        type: Type.STRING, 
                        enum: ["sightseeing", "nature", "culture", "food", "shopping", "entertainment", "relax", "transit"] 
                      },
                      images: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "Array of 2-4 high-quality image URLs for this location (if available)"
                      },
                      fullDescription: { 
                        type: Type.STRING, 
                        description: "Detailed 3-4 sentence description about what makes this place special and what visitors can expect"
                      },
                      openingHours: { 
                        type: Type.STRING, 
                        description: "REQUIRED: Operating hours for the location (e.g., 'Mon-Sun: 9:00 AM - 6:00 PM' or '24/7' or 'Tue-Sun: 10:00 AM - 5:00 PM, Closed Monday'). Research actual opening hours for each specific location."
                      },
                      suggestedDuration: { 
                        type: Type.STRING, 
                        description: "Recommended time to spend at this location (e.g., '2-3 hours', '30-45 minutes')"
                      },
                      ticketPrice: { 
                        type: Type.STRING, 
                        description: "Entry fee or ticket price range (e.g., '$15-25', 'Free', '₹500', 'Adults: $20, Children: $10')"
                      },
                      bestTimeToVisit: { 
                        type: Type.STRING, 
                        description: "Best time of day or season to visit this location (e.g., 'Early morning for fewer crowds', 'Sunset for best views')"
                      },
                      address: { 
                        type: Type.STRING, 
                        description: "Full street address of the location for accurate directions"
                      },
                      transportToNext: { 
                        type: Type.STRING, 
                        description: "How to get to the next activity (e.g., '10-min walk', 'Take metro Line 2', '15-min taxi ride')"
                      },
                      tags: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "2-4 relevant tags (e.g., ['Family-Friendly', 'Photo Spot', 'Historical', 'Local Favorite'])"
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