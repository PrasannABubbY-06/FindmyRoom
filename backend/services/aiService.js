const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini Client
// This requires GEMINI_API_KEY to be set in the environment variables
let ai;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } else {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

// Utility function to check if AI is configured
const isAIConfigured = () => {
  return !!ai;
};

/**
 * Parses a natural language search query into structured filters.
 */
async function parseSmartSearch(query) {
  if (!isAIConfigured()) return null;
  
  try {
    const prompt = `
      You are a Smart Search assistant for a room rental platform. 
      Parse the following user query into structured JSON filters.
      Possible filters: 
      - location (string)
      - maxPrice (number)
      - roomType (string, e.g., "Single Room", "Double Room", "Apartment", "PG")
      - genderPreference (string, e.g., "Male", "Female", "Any")
      - isFurnished (boolean)
      - hasAC (boolean)
      - hasWiFi (boolean)
      
      Query: "${query}"
      
      Respond ONLY with valid JSON. Do not include markdown formatting or extra text.
      If a filter is not mentioned, omit it from the JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("parseSmartSearch error:", error);
    return null;
  }
}

/**
 * Generates an attractive room description based on basic details.
 */
async function generateRoomDescription(details) {
  if (!isAIConfigured()) return "AI is not configured.";

  try {
    const prompt = `
      Write an engaging, professional, and attractive room rental description (about 3-4 sentences) based on the following details:
      Title: ${details.title}
      Location: ${details.location}
      Price: ${details.price}
      Facilities: ${details.facilities ? details.facilities.join(', ') : 'None specified'}
      
      Make it sound appealing to potential tenants. Do not include any HTML formatting, just plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("generateRoomDescription error:", error);
    return "Failed to generate description.";
  }
}

/**
 * Checks photo quality (dummy implementation for text-only models, but could use vision models).
 * For now, we'll just return a success since parsing base64 vision might be heavy.
 * If you have a Vision model configured, you can pass the image.
 */
async function checkPhotoQuality(imageBase64) {
  if (!isAIConfigured()) return { isGood: true, feedback: "" };

  try {
    // Note: To use vision properly with Gemini, we would pass the inlineData
    // For this example, if the base64 is too large or not formatted, we'll use a simpler text prompt
    // Assuming base64 format: "data:image/jpeg;base64,....."
    if (!imageBase64 || !imageBase64.includes('base64,')) {
        return { isGood: true, feedback: "" };
    }

    const base64Data = imageBase64.split('base64,')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        "Analyze this image for a room rental listing. Is the lighting good? Is it clear and not blurry? Is the room tidy? Respond with a JSON object containing 'isGood' (boolean) and 'feedback' (string). Provide ONLY valid JSON without markdown.",
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]
    });
    
    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("checkPhotoQuality error:", error);
    return { isGood: true, feedback: "Error analyzing photo." };
  }
}

/**
 * Detects if a listing is potentially fake.
 */
async function detectFakeListing(listing) {
  if (!isAIConfigured()) return { isFakeSuspicion: false, reason: "" };

  try {
    const prompt = `
      Analyze the following room rental listing to determine if it looks like a fake listing or scam.
      Red flags include: Prices that are impossibly low for the location, overly generic or copied descriptions, requests for money before viewing in the description.
      
      Title: ${listing.title}
      Location: ${listing.location}
      Price: ${listing.price}
      Description: ${listing.description}
      
      Respond ONLY with a JSON object: { "isFakeSuspicion": boolean, "reason": "string explaining why if suspicious" }
      No markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("detectFakeListing error:", error);
    return { isFakeSuspicion: false, reason: "" };
  }
}

/**
 * Detects scams in messages.
 */
async function detectScamMessage(messageContent) {
  if (!isAIConfigured()) return false;

  try {
    const prompt = `
      Analyze this chat message sent on a room rental platform. 
      Is it a scam? Red flags: Asking for an advance deposit before viewing, asking to move communication to WhatsApp immediately to avoid tracking, promising unrealistic things, sending suspicious links.
      
      Message: "${messageContent}"
      
      Respond ONLY with "YES" if it is highly likely a scam, or "NO" otherwise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim().toUpperCase() === "YES";
  } catch (error) {
    console.error("detectScamMessage error:", error);
    return false;
  }
}

/**
 * Get Recommendations based on user data.
 */
async function getRecommendations(userPrefs, rooms) {
  if (!isAIConfigured() || rooms.length === 0) return rooms.slice(0, 5);

  try {
    // Simplify rooms data to avoid token limits
    const roomsData = rooms.map(r => ({
      id: r._id,
      title: r.title,
      price: r.price,
      location: r.location,
      roomType: r.roomType,
      facilities: r.facilities
    }));

    const prompt = `
      You are an AI Recommendation Engine.
      User Profile/Preferences: ${JSON.stringify(userPrefs)}
      Available Rooms: ${JSON.stringify(roomsData)}
      
      Rank the top 5 most suitable rooms for this user based on their preferences (e.g., budget, location, lifestyle).
      Respond ONLY with a JSON array of the top room IDs. Example: ["id1", "id2"]
      No markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    
    const recommendedIds = JSON.parse(jsonStr);
    
    // Sort original rooms based on recommended IDs order
    return recommendedIds
      .map(id => rooms.find(r => r._id.toString() === id))
      .filter(Boolean);

  } catch (error) {
    console.error("getRecommendations error:", error);
    return rooms.slice(0, 5); // Fallback
  }
}

/**
 * Get Similar Rooms
 */
async function getSimilarRooms(targetRoom, allRooms) {
  if (!isAIConfigured() || allRooms.length === 0) return [];

  try {
    const candidateRooms = allRooms
      .filter(r => r._id.toString() !== targetRoom._id.toString())
      .map(r => ({
        id: r._id,
        title: r.title,
        price: r.price,
        location: r.location,
        roomType: r.roomType,
        facilities: r.facilities
      }));
      
    if (candidateRooms.length === 0) return [];

    const prompt = `
      Target Room: ${JSON.stringify({
        title: targetRoom.title,
        price: targetRoom.price,
        location: targetRoom.location,
        roomType: targetRoom.roomType,
        facilities: targetRoom.facilities
      })}
      
      Candidate Rooms: ${JSON.stringify(candidateRooms)}
      
      Find the 3 most similar candidate rooms to the Target Room based on price, location, and roomType.
      Respond ONLY with a JSON array of the room IDs. Example: ["id1", "id2", "id3"]
      No markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    
    const similarIds = JSON.parse(jsonStr);
    
    return similarIds
      .map(id => allRooms.find(r => r._id.toString() === id))
      .filter(Boolean);

  } catch (error) {
    console.error("getSimilarRooms error:", error);
    return [];
  }
}

/**
 * Get Roommate Recommendations
 */
async function getRoommateRecommendations(userPrefs, roommates) {
  if (!isAIConfigured() || roommates.length === 0) return roommates;

  try {
    const candidates = roommates.map(r => ({
      id: r._id,
      city: r.city,
      maxBudget: r.maxBudget,
      preferredGender: r.preferredGender,
      description: r.description,
      lifestyle: r.user?.lifestyle || {}
    }));

    const prompt = `
      You are an AI Roommate Matcher.
      User Profile/Preferences: ${JSON.stringify(userPrefs)}
      Available Roommate Requests: ${JSON.stringify(candidates)}
      
      Rank the top 5 most compatible roommates for this user based on lifestyle, budget, and location.
      Respond ONLY with a JSON array of the roommate request IDs. Example: ["id1", "id2"]
      No markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }
    
    const recommendedIds = JSON.parse(jsonStr);
    
    return recommendedIds
      .map(id => roommates.find(r => r._id.toString() === id))
      .filter(Boolean);

  } catch (error) {
    console.error("getRoommateRecommendations error:", error);
    return roommates;
  }
}

module.exports = {
  isAIConfigured,
  parseSmartSearch,
  generateRoomDescription,
  checkPhotoQuality,
  detectFakeListing,
  detectScamMessage,
  getRecommendations,
  getSimilarRooms,
  getRoommateRecommendations
};
