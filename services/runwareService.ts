
export const generateLunchboxImage = async (mealName: string, ingredients: string[], snack: string): Promise<string> => {
  const RUNWARE_API_KEY = "Orpa0Go54ZXXuIJPgtCfcjXKnH5rXG1J";
  
  // Runware requires a valid UUIDv4 for each task to track the operation.
  const taskUUID = crypto.randomUUID();
  
  const ingredientsText = ingredients.join('\n');
  const prompt = `Hyper-realistic, professional food photography of a healthy kid's bento lunchbox Packed in a modern, clean bento box, soft natural morning light, appetizing colors, studio quality, culinary magazine style, 8k resolution, delicious arrangement, centered composition, white background.
${mealName}:
ingredients:
${ingredientsText}
Snack: ${snack}`;
  
  // Requirement: console.log the image text prompt sent in the request.
  console.log("Runware Image Prompt:", prompt);

  try {
    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          "taskType": "authentication",
          "apiKey": RUNWARE_API_KEY
        },
        {
          "taskType": "imageInference",
          "taskUUID": taskUUID,
          "model": "runware:400@4",
          "positivePrompt": prompt,
          "width": 1024,
          "height": 1024,
          "numberResults": 1,
          "steps": 30
        }
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Runware API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Runware returns an array of data. We look for the one matching our taskUUID or just the first imageURL.
    if (result.data && result.data.length > 0) {
      const imageTask = result.data.find((d: any) => d.taskUUID === taskUUID || d.imageURL);
      if (imageTask && imageTask.imageURL) {
        return imageTask.imageURL;
      }
    }
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Runware Error: ${result.errors[0].message}`);
    }
    
    throw new Error("No image URL returned from Runware.");
  } catch (error) {
    console.error("Image generation failed:", error);
    return "";
  }
};
