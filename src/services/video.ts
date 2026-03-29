import type { NewsArticle } from '../types'

// Import the GoogleGenAI library
import { GoogleGenAI } from "@google/genai";

/**
 * Generate a video using Google's Veo model based on a prompt
 * @param prompt - The text prompt for video generation
 * @returns Promise that resolves to the video buffer when generation is complete
 */
export async function generateVideo(prompt: string): Promise<Buffer> {
  // Initialize the Google GenAI client
  // Check both GOOGLE_API_KEY and VITE_GOOGLE_API_KEY (following the pattern from groq service)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not set in environment');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Generate the video
  const operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
  });

  // Poll the operation status until the video is ready
  while (!operation.done) {
    // Wait 10 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 10000));
    // Update the operation status
    operation = await ai.operations.getVideosOperation({
      operation: operation,
    });
  }

  // Check if the operation succeeded
  if (!operation.response || !operation.response.generatedVideos || operation.response.generatedVideos.length === 0) {
    throw new Error('Video generation failed: no video generated');
  }

  // Download the generated video as a buffer
  const videoBuffer = await ai.files.download({
    file: operation.response.generatedVideos[0].video,
  });

  return videoBuffer;
}

/**
 * Generate a video from a news article by creating a descriptive prompt
 * @param article - The news article to create a video for
 * @returns Promise that resolves to the video buffer
 */
export async function generateVideoFromArticle(article: NewsArticle): Promise<Buffer> {
  const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
  A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

  // In a real implementation, we would create a more relevant prompt based on the article
  // For now, we use the example prompt from the user's request
  return generateVideo(prompt);
}