import { NextRequest } from 'next/server';
import { AssemblyAI } from 'assemblyai';

// Initialisieren des AssemblyAI-Clients
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string
});

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  console.log('Transcribe API called');
  // Überprüfen der HTTP-Methode
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extrahieren der Daten aus dem Request Body
  const { video_url, language } = await req.json();

  // Überprüfen, ob die erforderlichen Daten vorhanden sind
  if (!video_url || !language) {
    return new Response(JSON.stringify({ error: 'Missing required fields: video_url or language' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Starting transcription');
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });
    console.log('Transcription started, ID:', transcript.id);

    return new Response(JSON.stringify({ id: transcript.id, status: 'processing' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Detailed error in transcribe:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({ 
      error: 'Failed to start transcription', 
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}