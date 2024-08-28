import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });

// Entfernen Sie diese Zeile
// export const config = { runtime: 'edge' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Transcribe API called');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { video_url, language } = req.body;

  if (!video_url || !language) {
    return res.status(400).json({ error: 'Missing required fields: video_url or language' });
  }

  console.log('Request received:', { video_url, language });

  try {
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    return res.status(202).json({ status: 'processing', transcriptId: transcript.id });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return res.status(500).json({ error: 'Failed to start transcription' });
  }
}