import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not set in the environment variables');
}

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { transcriptId } = req.query;

  if (!transcriptId || typeof transcriptId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid transcriptId in query parameters' });
  }

  try {
    const transcript = await client.transcripts.get(transcriptId);
    return res.status(200).json(transcript);
  } catch (error) {
    console.error('Error fetching transcript status:', error);
    return res.status(500).json({ error: 'Failed to fetch transcript status' });
  }
}