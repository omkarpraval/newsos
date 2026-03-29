import type { NewsArticle } from '../src/types'
import { generateVideo, generateVideoFromArticle } from '../src/services/video'

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { prompt, article } = req.body

    let videoBuffer: Buffer
    if (article) {
      // Generate video from article (NewsArticle)
      videoBuffer = await generateVideoFromArticle(article as NewsArticle)
    } else if (prompt) {
      // Generate video from prompt
      videoBuffer = await generateVideo(prompt)
    } else {
      res.status(400).json({ error: 'Either prompt or article must be provided' })
      return
    }

    // Set the response headers for video download
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', 'attachment; filename="generated_video.mp4"')
    if (Buffer.isBuffer(videoBuffer)) {
      res.send(videoBuffer)
    } else {
      res.send(Buffer.from(videoBuffer as any))
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Video generation failed'
    console.error('Video generation error:', message)
    res.status(500).json({ error: message })
  }
}