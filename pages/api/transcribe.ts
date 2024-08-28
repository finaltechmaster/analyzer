import { NextApiRequest, NextApiResponse } from 'next';
import AssemblyAI from 'assemblyai';

const API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!API_KEY) {
  console.error('AssemblyAI API Key is not set in the environment variables');
  process.exit(1);
}

// Korrekte Initialisierung des AssemblyAI-Clients
const client = new AssemblyAI({
  apiKey: API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { video_url, language } = req.body;

    if (!video_url || !language) {
      return res.status(400).json({ error: 'Missing video_url or language in request body' });
    }

    console.log('Received video URL:', video_url);
    console.log('Language:', language);

    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    console.log('Transcription initiated:', transcript.id);

    // Poll for completion
    let completedTranscript = await pollForCompletion(transcript.id);

    return res.status(200).json(completedTranscript);
  } catch (error: any) {
    console.error('Error in transcription process:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

async function pollForCompletion(transcriptId: string, maxAttempts = 30, interval = 5000): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const transcript = await client.transcripts.get(transcriptId);
    
    if (transcript.status === 'completed') {
      return transcript;
    } else if (transcript.status === 'error') {
      throw new Error('Transcription failed: ' + transcript.error);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Transcription timed out');
}