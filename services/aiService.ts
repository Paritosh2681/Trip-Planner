import { Trip } from "../types";

const DEFAULT_API_KEY = "AIzaSyDfdcQj7Qh5yjQHpcY52Vn-GuEHCwjjjJs";

export const generateTripItinerary = async (destination: string, days: number, apiKey?: string): Promise<Trip> => {
  const keyToUse = apiKey || DEFAULT_API_KEY;

  // Optimized system instruction to reduce tokens
  const systemInstruction = `
    You are a world-class travel guide. Create exceptional, consistent travel itineraries.
    
    CRITICAL:
    1. Prioritize MOST FAMOUS, ICONIC locations (Top 3-5 attractions).
    2. VARY selection: Landmarks, Culture (Museums/Galleries), Nature, Shopping.
    3. MANDATORY: Include 1-2 FAMOUS Art Galleries & Museums.
    4. Provide EXACT, REAL GPS coordinates (8 decimal places) for every location.
    5. Output strictly valid JSON.
    
    COORDINATES:
    - MUST be exact entrance/center point on LAND.
    - Format: {lat: XX.XXXXXXXX, lng: XX.XXXXXXXX}
    - Verify against real maps.
    
    JSON STRUCTURE:
    {
      "destination": "string",
      "durationDays": number,
      "summary": "string",
      "bestTimeToVisit": "string",
      "budget": { "accommodation": "string", "food": "string", "activities": "string", "total": "string", "currency": "INR" },
      "schedule": [
        {
          "dayNumber": number,
          "theme": "string",
          "activities": [
            {
              "id": "string",
              "time": "string",
              "locationName": "string",
              "title": "string (SAME AS locationName)",
              "description": "string",
              "coordinates": {"lat": number, "lng": number},
              "duration": "string",
              "costEstimate": "string",
              "type": "sightseeing|nature|culture|food|shopping|entertainment|relax|transit",
              "images": ["string"],
              "fullDescription": "string",
              "openingHours": "string",
              "suggestedDuration": "string",
              "ticketPrice": "string",
              "bestTimeToVisit": "string",
              "address": "string",
              "transportToNext": "string",
              "tags": ["string"]
            }
          ]
        }
      ]
    }
  `;

  const prompt = `Plan a ${days}-day trip to ${destination}. Currency: INR. Include top landmarks, museums, art galleries, and nature.`;

  try {
    // Using Google Gemini API directly via REST to avoid SDK dependency and reduce bundle size
    // Switching to gemini-2.0-flash-exp as requested/available
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${keyToUse}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemInstruction + "\n\n" + prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 1,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error:", response.status, response.statusText, errorData);
      throw new Error(`Gemini API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No response from AI");
    }

    console.log('Raw API Output:', responseText.substring(0, 200) + '...');
    
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    let trip: Trip;
    try {
      trip = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error("Failed to parse AI response as JSON");
    }
  
    // Post-process
    trip.schedule.forEach(day => {
      day.activities.forEach(activity => {
        if (!activity.title || activity.title.trim() === '') {
          activity.title = activity.locationName || 'Unknown Location';
        }
      });
    });

    return trip;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error?.message?.includes('API_KEY_INVALID') || error?.status === 400) {
      throw new Error("Invalid API Key. Please check your Google AI Studio API key.");
    }
    throw new Error(error?.message || "Unable to generate trip. Please try again.");
  }
};