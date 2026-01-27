import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { UserProfile } from "../../../types";

const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;
const RUNWARE_MODEL = process.env.RUNWARE_MODEL || "runware:100@1";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-pro-preview";

async function generateRunwareImage(mealName: string, ingredients: string[], snack: string): Promise<string> {
  const taskUUID = crypto.randomUUID();
  const ingredientsText = ingredients.join('\n');
  const prompt = `Hyper-realistic, professional food photography of a healthy kid's bento lunchbox Packed in a modern, clean bento box, soft natural morning light, appetizing colors, studio quality, culinary magazine style, 8k resolution, delicious arrangement, centered composition, white background.
${mealName}:
ingredients:
${ingredientsText}
Snack: ${snack}`;

  try {
    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { "taskType": "authentication", "apiKey": RUNWARE_API_KEY },
        {
          "taskType": "imageInference",
          "taskUUID": taskUUID,
          "model": RUNWARE_MODEL,
          "positivePrompt": prompt,
          "width": 1024,
          "height": 1024,
          "numberResults": 1,
          "steps": 25
        }
      ]),
    });

    const result = await response.json();
    if (result.data && result.data.length > 0) {
      const imageTask = result.data.find((d: any) => d.taskUUID === taskUUID || d.imageURL);
      if (imageTask?.imageURL) return imageTask.imageURL;
    }
    return "";
  } catch (error) {
    console.error("Runware error:", error);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const profile: UserProfile = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

    const prompt = `Create a 7-day (Monday to Sunday) kid-friendly lunchbox plan for a ${profile.age} year old for the period: ${profile.targetWeek}.
    Restrictions: ${profile.allergies.join(', ') || 'None'}.
    Excluded Foods: ${profile.excludedIngredients?.join(', ') || 'None'}.
    Diet: ${profile.dietType}.
    Preferences: ${profile.preferences || 'None'}.
    
    Return a JSON object with keys "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".`;

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

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
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

    const rawPlan = JSON.parse(response.text || "{}");
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const imagePromises = days.map(day => 
      generateRunwareImage(
        rawPlan[day].name, 
        rawPlan[day].ingredients.map((ing: any) => ing.name), 
        rawPlan[day].snack
      )
    );
    
    const imageUrls = await Promise.all(imagePromises);
    days.forEach((day, index) => { rawPlan[day].imageUrl = imageUrls[index]; });

    return NextResponse.json(rawPlan);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}