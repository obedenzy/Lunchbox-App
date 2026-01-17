
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WeeklyPlan } from "../types";
import { generateLunchboxImage } from "./runwareService";

export const generateLunchPlan = async (profile: UserProfile): Promise<WeeklyPlan> => {
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
    - "steps": 4-6 robust, detailed, and logical assembly steps for a busy parent.
    - "nutritionSummary": Brief health benefit.
    - "kidBenefit": "Why it's good for you" for a kid.
    - "macros": Object with "calories", "protein", "carbs", "fat" (numbers).
    - "note": Encouraging note (max 15 words).`;

  const lunchDaySchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            benefit: { type: Type.STRING },
          },
          required: ["name", "benefit"],
        }
      },
      snack: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      nutritionSummary: { type: Type.STRING },
      kidBenefit: { type: Type.STRING },
      macros: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
        },
        required: ["calories", "protein", "carbs", "fat"],
      },
      note: { type: Type.STRING },
    },
    required: ["name", "ingredients", "snack", "steps", "nutritionSummary", "kidBenefit", "macros", "note"],
  };

  try {
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

    const planText = response.text;
    if (!planText) throw new Error("The AI returned an empty response.");
    
    const rawPlan = JSON.parse(planText);
    
    // Generate images for each day in parallel to save time
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const imagePromises = days.map(day => 
      generateLunchboxImage(
        rawPlan[day].name, 
        rawPlan[day].ingredients.map((ing: any) => ing.name), 
        rawPlan[day].snack
      )
    );
    
    const imageUrls = await Promise.all(imagePromises);
    
    days.forEach((day, index) => {
      rawPlan[day].imageUrl = imageUrls[index];
    });

    const plan: WeeklyPlan = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      weekLabel: profile.targetWeek,
      profile: profile,
      ...rawPlan
    };

    return plan;
  } catch (error: any) {
    console.error("Plan generation error:", error);
    throw new Error(error.message || "Failed to generate lunch plan.");
  }
};
