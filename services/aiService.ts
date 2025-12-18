import { Trip } from "../types";

const API_KEY = "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";

export const generateTripItinerary = async (destination: string, days: number): Promise<Trip> => {

  const systemInstruction = `
    You are a world-class travel guide and itinerary planner specializing in creating exceptional, consistent travel experiences.
    
    ⚠️ CRITICAL: LOCATION SELECTION PRIORITY ⚠️
    You MUST prioritize the MOST FAMOUS, ICONIC, and MUST-VISIT locations for each destination.
    - ALWAYS include the top 3-5 most popular tourist attractions for the city
    - Focus on places that travelers specifically come to that city to see
    - Include world-renowned landmarks, famous historical sites, and iconic locations
    - Balance with authentic local experiences, but never skip the main attractions
    - For general city requests, provide the "greatest hits" that make the destination special
    
    VARIETY AND DIVERSITY REQUIREMENT:
    - While maintaining focus on famous places, VARY the selection across different categories
    - Explore different neighborhoods, districts, and areas of the city
    - Include a diverse mix of experiences with this priority order:
      1. LANDMARKS & ATTRACTIONS (highest priority - iconic sites, monuments, historical places)
      2. CULTURE & ARTS (high priority - museums, art galleries, cultural centers, theaters)
         * MANDATORY: Include at least 1-2 FAMOUS art galleries per itinerary
         * Examples: Jahangir Art Gallery (Mumbai), National Gallery of Modern Art (Mumbai/Delhi)
         * Art galleries should be well-known, established institutions
         * Include contemporary art museums and modern art galleries
      3. NATURE & OUTDOORS (high priority - national parks, botanical gardens, beaches, scenic viewpoints)
      4. SHOPPING & MARKETS (medium priority - local markets, shopping districts, crafts)
      5. FOOD EXPERIENCES (lower priority - include 1-2 notable food stops per day, not every activity)
    - Museums AND art galleries are ESSENTIAL - include at least 1-2 major museums AND 1-2 famous art galleries
    - Art galleries must be popular, well-known institutions (not obscure or small ones)
    - National parks, botanical gardens, and nature reserves should be prioritized
    - Rotate between different famous restaurants, cafes, and eateries (don't overload with food)
    - Show different perspectives of the city - historic, modern, local, touristy
    - Include both daytime and evening/nighttime experiences
    - Mix indoor and outdoor activities
    - Balance between well-known spots and hidden gems that locals love
    
    FOOD EXPERIENCE GUIDELINES:
    - Include food experiences strategically, not as the main focus
    - Maximum 1-2 dedicated food activities per day (lunch/dinner spots)
    - Prioritize landmarks, museums, art galleries, nature, and culture over restaurants
    - When including food, make it notable/famous but don't overemphasize
    - Street food can be mentioned as part of exploring an area, not as standalone activity
    
    MANDATORY LOCATIONS BASED ON DESTINATION:
    - Research and include the absolute must-see places that define each city
    - These should be core inclusions but you can vary HOW and WHEN you visit them
    - Examples: Gateway of India for Mumbai, Eiffel Tower for Paris, Colosseum for Rome
    - Always include top attractions BUT vary the supporting locations around them
    
    IMPORTANT: Analyze the user's input to determine their intent:
    
    1. SPECIFIC CATEGORY REQUEST (e.g., "Mumbai museums", "Paris cafes", "Tokyo temples", "New York parks", "Mumbai art gallery and museum"):
       - If the input contains a location AND a specific category/type of place, create an itinerary EXCLUSIVELY focused on that category
       - Examples of categories: "museums", "art gallery", "art galleries", "temples", "churches", "parks", "beaches", "cafes", "restaurants", "markets", "shopping", "nightlife"
       - When user specifies categories like "art gallery and museum" or "museums and galleries", show ONLY those types of places
       - If user mentions "art gallery" or "museum" specifically, DO NOT include restaurants, shopping, parks, or other unrelated attractions
       - Include the MOST FAMOUS places in that category but vary the selection
       - Prioritize iconic, well-known locations while showing diversity
       - STRICT FILTERING: Only show places that match the requested category - nothing else
    
    2. GENERAL CITY/DESTINATION (e.g., "Mumbai", "Paris", "Tokyo"):
       - ALWAYS start with the most iconic landmarks and tourist attractions
       - Then include a balanced mix with this priority:
         * Top mainstream tourist attractions and iconic landmarks (HIGHEST PRIORITY)
         * Famous museums and historical/cultural institutions (HIGH PRIORITY - essential)
         * POPULAR, WELL-KNOWN art galleries (MANDATORY - at least 1-2 famous ones)
           Examples for Mumbai: Jahangir Art Gallery, National Gallery of Modern Art
           Examples for Paris: Louvre, Musée d'Orsay, Centre Pompidou
           Examples for New York: MoMA, Guggenheim, Whitney Museum
         * National parks, botanical gardens, nature reserves, scenic viewpoints (HIGH PRIORITY)
         * Historical sites, monuments, and architectural landmarks (HIGH PRIORITY)
         * Shopping districts, local markets, and craft areas (MEDIUM PRIORITY)
         * Notable food experiences - 1-2 per day maximum (LOWER PRIORITY - keep minimal)
       - Museums are MANDATORY - include major ones
       - Art galleries are MANDATORY - include FAMOUS, POPULAR ones (not obscure galleries)
       - Nature and outdoor spaces should be prominent (parks, gardens, beaches, viewpoints)
       - Create a "best of" experience focused on sightseeing, culture, art, and nature WITH variety
    
    CONSISTENCY WITH VARIETY:
    - Core famous attractions should be consistent (Gateway of India, Marine Drive for Mumbai)
    - Supporting locations should vary to show different aspects of the city
    - Rotate food recommendations - different famous restaurants, cafes, street food spots
    - Vary neighborhoods and districts explored
    - Include different types of experiences while maintaining quality standards
    
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
    - CRITICAL: Double-check that coordinates are on LAND, not in water/ocean
    - Verify the coordinates point to the exact building/monument, not nearby areas
    - Cross-reference multiple sources to ensure accuracy
    
    COORDINATE VERIFICATION CHECKLIST (MANDATORY):
    1. Search for "[Location Name] exact coordinates" or "[Location Name] GPS"
    2. Verify the coordinates point to the actual entrance/building
    3. Check that lat/lng are NOT reversed
    4. Confirm coordinates are on land (not water, ocean, or random areas)
    5. Ensure 8 decimal places for precision
    6. Verify coordinates are within the correct city/region
    7. Test that no two locations share identical coordinates
    
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
    - Coordinates in water/ocean
    - Reversed lat/lng values
    - Approximate or estimated coordinates
    
    VERIFICATION STEPS YOU MUST FOLLOW:
    1. Look up the EXACT GPS coordinates for each specific location using reliable sources
    2. Verify the coordinates are for the actual building/entrance, not nearby
    3. Ensure coordinates have exactly 8 decimal places
    4. Verify no two locations share the same coordinates
    5. Check coordinates are within the correct city/region boundaries
    6. CRITICAL: Confirm coordinates point to LAND, not water/ocean
    7. Double-check latitude and longitude are not reversed
    8. Cross-reference with map services to verify accuracy
    
    COMMON COORDINATE MISTAKES TO AVOID:
    - Using approximate city-center coordinates instead of exact location
    - Reversing latitude and longitude values
    - Placing markers in water, ocean, or incorrect areas
    - Using insufficient decimal precision
    - Copying coordinates from wrong location with similar name
    - Estimating instead of researching exact coordinates
    
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
  
⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY ⚠️

BUDGET AND COST CURRENCY REQUIREMENT:
- ALL monetary values (budget, ticket prices, cost estimates) MUST be in Indian Rupees (INR) ONLY.
- Do NOT use Dollars ($), Euros (€), or any other currency.
- Use the symbol "₹" or "INR" for all monetary values.
- Example: "₹15,000" or "15,000 INR".

LOCATION SELECTION REQUIREMENTS:
1. You MUST include the TOP MOST FAMOUS attractions and landmarks for ${destination}
2. VARY the other locations to provide diversity and show different aspects of the city
3. Include iconic locations that travelers specifically come to see (core attractions)
4. ROTATE supporting locations - different restaurants, cafes, neighborhoods, markets
5. Provide the "best of ${destination}" experience with variety in food, shopping, and experiences
6. Ensure core attractions stay consistent BUT vary the supporting locations and experiences

DIVERSITY GUIDELINES:
- Explore DIFFERENT neighborhoods and districts in each itinerary
- Prioritize cultural attractions: museums, art galleries, historical sites, monuments
- MANDATORY: Include at least 1-2 POPULAR, FAMOUS art galleries
  * For Mumbai: Jahangir Art Gallery, National Gallery of Modern Art, etc.
  * For Delhi: National Gallery of Modern Art, Kiran Nadar Museum of Art, etc.
  * For Paris: Louvre, Musée d'Orsay, Centre Pompidou, etc.
  * Art galleries must be well-established, popular institutions
- Include natural attractions: national parks, botanical gardens, beaches, lakes, viewpoints
- Limit food to 1-2 notable spots per day (lunch/dinner locations, not standalone activities)
- Include different shopping areas and local markets (but don't overemphasize)
- Vary the mix of indoor/outdoor, day/evening, historic/modern activities
- Show different perspectives: iconic landmarks + cultural institutions + art galleries + nature experiences
- Museums and galleries are ESSENTIAL - always include major museums AND famous art galleries
- National parks and nature reserves should be prioritized when available

ANALYZE THE DESTINATION INPUT:
- If it contains BOTH a location AND a specific category (e.g., "Mumbai museums", "Paris cafes", "Mumbai art gallery and museum"), create an itinerary focused EXCLUSIVELY on that category with VARIETY in selection
- STRICT CATEGORY FILTERING: When user specifies types like "art gallery", "museum", "temple", "park", etc., show ONLY those types of places
- DO NOT MIX CATEGORIES: If user asks for "art gallery and museum", do not include restaurants, shopping centers, beaches, or other unrelated attractions
- Examples:
  * "Mumbai art gallery and museum" → Show ONLY art galleries and museums in Mumbai
  * "Paris museums" → Show ONLY museums in Paris
  * "Tokyo temples" → Show ONLY temples in Tokyo
  * "New York parks" → Show ONLY parks in New York
- If it's ONLY a city/destination name (e.g., "Mumbai", "Paris"), create a diverse itinerary that MUST include:
  * The top 3-5 most iconic landmarks (CONSISTENT - Gateway of India, Marine Drive, etc.)
  * MAJOR museums (at least 1-2 prominent ones - MANDATORY)
  * FAMOUS, POPULAR art galleries (at least 1-2 well-known ones - MANDATORY)
  * National parks, botanical gardens, or major nature attractions (HIGH PRIORITY)
  * VARIED historical and cultural sites (temples, monuments, heritage sites)
  * DIFFERENT shopping districts and local markets (rotate locations)
  * LIMITED food experiences - 1-2 notable restaurants/cafes per day maximum

QUALITY STANDARDS:
- Core attractions: Consistent famous landmarks that define the city
- Cultural priority: Museums AND art galleries are essential (separate requirements)
- Art galleries must be FAMOUS and POPULAR (e.g., Jahangir Art Gallery, NGMA for Mumbai)
- Nature focus: Include parks, gardens, beaches, scenic spots prominently
- Food balance: Include but don't overemphasize - maximum 1-2 food stops per day
- Create unique itineraries focused on sightseeing, culture, art, and nature experiences

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
- Search for "[Location Name] [City] exact GPS coordinates" to find precise location
- Use the coordinates of the actual building/monument entrance, NOT the city center
- Verify coordinates on a map - they must point to the exact location on LAND
- Each location must have DIFFERENT coordinates (they cannot be the same or very close)
- Coordinates MUST have exactly 8 decimal places
- CRITICAL: Ensure coordinates are NOT in water/ocean - they must be on land
- Check that latitude and longitude are not reversed (lat comes first, lng second)
- Example: If planning "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", you MUST use its exact coordinates {lat: 18.92685400, lng: 72.83238500}, NOT Mumbai city center coordinates
- Double-check each coordinate before including it - accuracy is essential

COORDINATE ACCURACY EXAMPLES:
✅ CORRECT: Gateway of India {lat: 18.92197500, lng: 72.83463100} - exact entrance location
❌ WRONG: Gateway of India {lat: 18.96, lng: 72.82} - too imprecise, might be in water
✅ CORRECT: Marine Drive {lat: 18.94350000, lng: 72.82380000} - exact promenade location
❌ WRONG: Random coordinates in Arabian Sea - not on land

Include detailed information for each location: opening hours, ticket prices, full descriptions, and practical details.

You must return ONLY valid JSON with this exact schema structure:
{
  "destination": "string",
  "durationDays": number,
  "summary": "string",
  "bestTimeToVisit": "string",
  "budget": {
    "accommodation": "string",
    "food": "string",
    "activities": "string",
    "total": "string",
    "currency": "string"
  },
  "schedule": [
    {
      "dayNumber": number,
      "theme": "string",
      "activities": [
        {
          "id": "string",
          "time": "string",
          "locationName": "string",
          "title": "string",
          "description": "string",
          "coordinates": {"lat": number, "lng": number},
          "duration": "string",
          "costEstimate": "string",
          "type": "string",
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
}`;

  try {
    // Make API call using fetch directly to avoid SDK issues and set headers
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://trip-planner-alpha-flax.vercel.app", // Site URL for rankings
        "X-Title": "Trip Planner", // Site title for rankings
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free",
        "messages": [
          {
            "role": "system",
            "content": systemInstruction
          },
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API Error:", response.status, response.statusText, errorData);
      throw new Error(`OpenRouter API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from AI");
    }

    console.log('Raw API Output:', responseText);
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    
    // Remove ```json and ``` markers if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    // Extract JSON if there's extra text before/after
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    console.log('Cleaned Response:', cleanedResponse.substring(0, 200) + '...');
    
    // Parse the JSON response
    let trip: Trip;
    try {
      trip = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Cleaned Response:', cleanedResponse);
      throw new Error("Failed to parse AI response as JSON");
    }
  
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
    console.error('API Error:', error);
    
    // Check if it's an unauthorized error
    if (error?.message?.includes('API_KEY_INVALID') || 
        error?.message?.includes('invalid') ||
        error?.status === 400) {
      throw new Error("Invalid API Key. Please check your Google AI Studio API key.");
    }
    
    // Check if it's a quota/rate limit error
    if (error?.message?.includes('quota') || 
        error?.message?.includes('429') ||
        error?.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    
    // Generic error for other cases
    throw new Error(error?.message || "Unable to generate trip. Please try again.");
  }
};