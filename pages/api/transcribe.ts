import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not set in the environment variables');
}

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

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
      language_detection: true, // Aktiviert die automatische Spracherkennung
    });

    console.log('Transcript created:', transcript);

    if (!transcript.id) {
      throw new Error('No transcript ID received');
    }

    return res.status(202).json({ 
      status: 'processing', 
      transcriptId: transcript.id, 
      detectedLanguage: transcript.language_code // Fügt die erkannte Sprache hinzu
    });
  } catch (error: unknown) {
    console.error('Error starting transcription:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: 'Failed to start transcription', details: error.message });
    } else {
      return res.status(500).json({ error: 'Failed to start transcription', details: 'An unknown error occurred' });
    }
  }
}