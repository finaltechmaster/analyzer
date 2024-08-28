import { AssemblyAI } from 'assemblyai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest } from 'next/server';

// Initialisieren des AssemblyAI-Clients
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string
});

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  // Überprüfen der HTTP-Methode
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Extrahieren der Daten aus dem Request Body
  const { video_url, language } = req.body;

  // Überprüfen, ob die erforderlichen Daten vorhanden sind
  if (!video_url || !language) {
    return res.status(400).json({ error: 'Missing required fields: video_url or language' });
  }

  console.log('Received request:', { video_url, language });

  try {
    // Erstellen des Transkripts
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    console.log('Transcription initiated:', transcript.id);

    // Warten auf den Abschluss der Transkription
    const result = await pollForCompletion(transcript.id);

    console.log('Transcription completed:', result.id);

    // Senden der Antwort
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Detailed error:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Hilfsfunktion zum Pollen des Transkriptionsstatus
async function pollForCompletion(transcriptId: string, maxAttempts = 60): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const transcript = await client.transcripts.get(transcriptId);
    
    if (transcript.status === 'completed') {
      return transcript;
    } else if (transcript.status === 'error') {
      throw new Error('Transcription failed: ' + transcript.error);
    }

    // Warten für 5 Sekunden vor dem nächsten Versuch
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Transcription timed out');
}