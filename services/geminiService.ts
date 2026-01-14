
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WeeklyPlan } from "../types";

export const generateLunchPlan = async (profile: UserProfile): Promise<WeeklyPlan> => {
  // Always create a new GoogleGenAI instance right before making an API call to ensure it uses the current environment settings.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Create a 7-day (Monday to Sunday) kid-friendly lunchbox plan for a ${profile.age} year old for the period: ${profile.targetWeek}.
    Restrictions: ${profile.allergies.join(', ') || 'None'}.
    Diet: ${profile.dietType}.
    Preferences: ${profile.preferences || 'None'}.
    
    Return a JSON object with keys "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".
    Each day must have:
    - "name": Catchy meal name.
    - "ingredients": Array of objects, each with "name" (the food) and "benefit" (a short 3-5 word health benefit for this specific ingredient).
    - "snack": One healthy side.
    - "steps": 2 quick assembly steps.
    - "nutritionSummary": Brief health benefit.
    - "kidBenefit": "Why it's good for you" for a kid.
    - "macros": Object with "calories", "protein", "carbs", "fat" (numbers).
    - "note": Encouraging note (max 15 words).`;

  const ingredientSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      benefit: { type: Type.STRING },
    },
    required: ["name", "benefit"],
  };

  const macrosSchema = {
    type: Type.OBJECT,
    properties: {
      calories: { type: Type.NUMBER },
      protein: { type: Type.NUMBER },
      carbs: { type: Type.NUMBER },
      fat: { type: Type.NUMBER },
    },
    required: ["calories", "protein", "carbs", "fat"],
  };

  const lunchDaySchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      ingredients: { type: Type.ARRAY, items: ingredientSchema },
      snack: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      nutritionSummary: { type: Type.STRING },
      kidBenefit: { type: Type.STRING },
      macros: macrosSchema,
      note: { type: Type.STRING },
    },
    required: ["name", "ingredients", "snack", "steps", "nutritionSummary", "kidBenefit", "macros", "note"],
  };

  try {
    // Upgraded model to 'gemini-3-pro-preview' for advanced reasoning tasks as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            Monday: lunchDaySchema,
            Tuesday: lunchDaySchema,
            Wednesday: lunchDaySchema,
            Thursday: lunchDaySchema,
            Friday: lunchDaySchema,
            Saturday: lunchDaySchema,
            Sunday: lunchDaySchema,
          },
          required: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
      },
    });

    // Console log token usage metadata
    if (response.usageMetadata) {
      console.log("--- Gemini Token Usage ---");
      console.log("Tokens Sent (Prompt):", response.usageMetadata.promptTokenCount);
      console.log("Tokens Received (Candidates):", response.usageMetadata.candidatesTokenCount);
      console.log("Total Tokens:", response.usageMetadata.totalTokenCount);
      console.log("---------------------------");
    }

    // Directly access the .text property from GenerateContentResponse
    const planText = response.text;
    if (!planText) throw new Error("The AI returned an empty response. Please try again.");
    
    const rawPlan = JSON.parse(planText);
    
    const plan: WeeklyPlan = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      weekLabel: profile.targetWeek,
      profile: profile,
      ...rawPlan
    };

    return plan;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate lunch plan.");
  }
};
