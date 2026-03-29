import type { NewsArticle } from '../types'

/**
 * GENERATIVE VIDEO PIPELINE 
 * (Mocked for Demo reliability while ensuring logic is consistent)
 */
export async function generateVideo(prompt: string): Promise<Buffer> {
  console.log('[VIDEO] Generating video for prompt:', prompt);
  // Simulate network delay
  await new Promise(r => setTimeout(r, 2000));
  
  // Return dummy buffer
  return Buffer.from('dummy-video-content');
}

export async function generateVideoFromArticle(article: NewsArticle): Promise<Buffer> {
  console.log('[VIDEO] Building prompt for article:', article.title);
  const prompt = `A news anchor reporting on: ${article.title}. Tone: professional, breaking news. Analogy: hand-drawn illustration.`;
  return generateVideo(prompt);
}