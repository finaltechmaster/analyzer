import { NextApiRequest, NextApiResponse } from 'next';
import AssemblyAI from 'assemblyai';

// Vercel-spezifische Umgebungsvariable
const API_KEY = process.env.ASSEMBLYAI_API_KEY;

// Überprüfen Sie, ob der API-Schlüssel vorhanden ist
if (!API_KEY) {
  console.error('AssemblyAI API Key is not set in the environment variables');
}

// Initialisieren Sie den Client mit Ihrem API-Schlüssel
const client = new AssemblyAI({
  apiKey: API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { video_url, language } = req.body;

      console.log('Received video URL:', video_url);
      console.log('Language:', language);

      // Erstellen Sie ein neues Transkript
      const transcript = await client.transcripts.create({
        audio_url: video_url,
        language_code: language,
      });

      console.log('Transcription response:', transcript);

      return res.status(200).json(transcript);
    } catch (error: any) {
      console.error('Caught error:', error);
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}