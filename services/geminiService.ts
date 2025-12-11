import { GoogleGenAI, Type } from "@google/genai";
import { Trip } from "../types";

// Ensure API Key is present
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
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

  const systemInstruction = `
    You are a world-class travel guide and itinerary planner. You create diverse, exciting, and well-balanced itineraries for general travelers.
    
    IMPORTANT: Analyze the user's input to determine their intent:
    
    1. SPECIFIC CATEGORY REQUEST (e.g., "Mumbai museums", "Paris cafes", "Tokyo temples", "New York parks"):
       - If the input contains a location AND a specific category/type of place, create an itinerary EXCLUSIVELY focused on that category
       - Examples: "museums", "temples", "churches", "parks", "beaches", "cafes", "restaurants", "markets", "shopping", "nightlife"
       - Include ONLY places that match the specified category
       - Create a focused, themed itinerary around that single category
    
    2. GENERAL CITY/DESTINATION (e.g., "Mumbai", "Paris", "Tokyo"):
       - If ONLY a city/destination name is provided without a specific category, create a diverse, balanced itinerary covering:
         * Mainstream tourist attractions and iconic landmarks (sightseeing)
         * Nature, parks, beaches, and outdoor scenery (nature)
         * Local culture, history, and museums (culture)
         * Authentic food experiences, from street food to famous restaurants (food)
         * Leisure, shopping, and entertainment (shopping/entertainment)
    
    Do NOT focus exclusively on architecture unless specifically requested. Treat architectural sites as just one category among many.
    
    Your tone should be friendly, descriptive, and inviting—like a knowledgeable local sharing their favorite spots. 
    Avoid overly technical, academic, or dry language. Focus on the experience and atmosphere.
    
    ⚠️ CRITICAL COORDINATE REQUIREMENTS - EXTREMELY IMPORTANT ⚠️
    You MUST provide HIGHLY ACCURATE GPS coordinates with EXACTLY 8 decimal places for EVERY location:
    - Research and use the EXACT real-world coordinates of each specific place
    - Use the coordinates of the MAIN ENTRANCE or CENTER POINT of each location
    - NEVER use city-center coordinates or approximate locations
    - NEVER reuse the same coordinates for different locations
    - NEVER make up or estimate coordinates
    - Each location MUST have UNIQUE coordinates that are at least 100 meters apart
    - Verify each coordinate matches the ACTUAL physical location by checking against real maps
    - Format MUST be: {lat: XX.XXXXXXXX, lng: XX.XXXXXXXX} (8 decimal places)
    
    Examples of REQUIRED precision:
    - Gateway of India, Mumbai: {lat: 18.92197500, lng: 72.83463100}
    - Taj Mahal, Agra: {lat: 27.17500600, lng: 78.04215500}
    - Eiffel Tower, Paris: {lat: 48.85837009, lng: 2.29447746}
    - Statue of Liberty, NYC: {lat: 40.68924500, lng: -74.04450040}
    - Sydney Opera House: {lat: -33.85678200, lng: 151.21529800}
    - Colosseum, Rome: {lat: 41.89020800, lng: 12.49223100}
    
    INCORRECT (will be rejected):
    - Too few decimals: {lat: 27.175, lng: 78.042}
    - City center: {lat: 19.07, lng: 72.87}
    - Same coords for different places
    
    VERIFICATION STEPS YOU MUST FOLLOW:
    1. Look up the EXACT GPS coordinates for each specific location
    2. Ensure coordinates have 8 decimal places
    3. Verify no two locations share the same coordinates
    4. Check coordinates are within the correct city/region
    
    ⚠️ OPENING HOURS REQUIREMENT ⚠️
    You MUST provide accurate opening hours for EVERY location. Research and include:
    - Actual operating hours for museums, attractions, restaurants, shops
    - Day-specific hours if they vary (e.g., "Mon-Fri: 9 AM - 6 PM, Sat-Sun: 10 AM - 8 PM")
    - Closed days (e.g., "Closed on Mondays")
    - For outdoor/public spaces: "Open 24/7" or "Dawn to dusk"
    - For restaurants: Include lunch/dinner hours or "Open daily: 11 AM - 11 PM"
    
    The output must be strictly valid JSON matching the schema provided.
  `;

  const prompt = `Plan a ${days}-day trip to ${destination}. 
  
IMPORTANT: Analyze the destination input carefully:
- If it contains BOTH a location AND a specific category (e.g., "Mumbai museums", "Paris cafes", "Tokyo temples"), create an itinerary focused EXCLUSIVELY on that category type. Include ONLY places that match the specified category.
- If it's ONLY a city/destination name (e.g., "Mumbai", "Paris"), create a diverse, balanced itinerary with popular attractions, local experiences, and varied activities across all categories.

CRITICAL FOR EACH ACTIVITY - FOLLOW THIS EXACT STRUCTURE:
Step 1: Create "locationName" with just the place name (e.g., "Gateway of India")
Step 2: Copy that EXACT same text to "title" field
Step 3: Create "description" with the experience text (e.g., "Mumbai's iconic arch monument...")

EXAMPLE OF CORRECT FORMAT:
{
  "id": "d1-a1",
  "time": "09:00 - 12:00",
  "locationName": "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya",
  "title": "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya",
  "description": "Mumbai's premier museum, showcasing vast collections of Indian art, archaeology, and natural history in a stunning Indo-Saracenic building."
}

WRONG FORMAT (DO NOT DO THIS):
{
  "locationName": "Museum",
  "title": "Mumbai's premier museum showcasing art...",
  "description": "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya"
}

ABSOLUTE REQUIREMENT FOR COORDINATES - THIS IS CRITICAL:
You MUST look up and provide the EXACT, REAL GPS coordinates for each specific location. Do NOT estimate or approximate.
- Search for the exact location name + "coordinates" or "GPS" 
- Use the coordinates of the actual building/monument entrance, NOT the city center
- Each location must have DIFFERENT coordinates (they cannot be the same or very close)
- Coordinates MUST have exactly 8 decimal places
- Example: If planning "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", you MUST use its exact coordinates {lat: 18.92685400, lng: 72.83238500}, NOT Mumbai city center coordinates

Include detailed information for each location: opening hours, ticket prices, full descriptions, and practical details.`;

  const model = "gemini-2.5-flash";

  try {
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
            summary: { type: Type.STRING },
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
                  theme: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        time: { type: Type.STRING },
                        locationName: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        coordinates: {
                          type: Type.OBJECT,
                          properties: {
                            lat: { type: Type.NUMBER },
                            lng: { type: Type.NUMBER }
                          }
                        },
                        duration: { type: Type.STRING },
                        costEstimate: { type: Type.STRING },
                        type: { type: Type.STRING },
                        images: { type: Type.ARRAY, items: { type: Type.STRING } },
                        fullDescription: { type: Type.STRING },
                        openingHours: { type: Type.STRING },
                        suggestedDuration: { type: Type.STRING },
                        ticketPrice: { type: Type.STRING },
                        bestTimeToVisit: { type: Type.STRING },
                        address: { type: Type.STRING },
                        transportToNext: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
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

    const trip = JSON.parse(response.text) as Trip;
  
    // Post-process to fix title/description swap if AI got it wrong
    trip.schedule.forEach(day => {
      day.activities.forEach(activity => {
        // If title is longer than 50 chars or description is shorter than 15 chars, they're likely swapped
        if (activity.title && activity.description) {
          const titleIsLong = activity.title.length > 50;
          const descIsShort = activity.description.length < 15;
          const titleHasCommas = activity.title.includes(',');
          
          // Swap if title looks like a description
          if (titleIsLong || (titleHasCommas && descIsShort)) {
            const temp = activity.title;
            activity.title = activity.description;
            activity.description = temp;
          }
        }
        
        // Ensure title has a value - use locationName as fallback
        if (!activity.title || activity.title.trim() === '') {
          activity.title = activity.locationName || 'Unknown Location';
        }
      });
    });

    return trip;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Check if it's a quota/rate limit error
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || 
        error?.message?.includes('quota') || 
        error?.message?.includes('429') ||
        error?.status === 429) {
      throw new Error("Server Under Maintenance, Please Try Again Tomorrow");
    }
    
    // Generic error for other cases
    throw new Error("Server Under Maintenance, Please Try Again Tomorrow");
  }
};