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
    // Erstellen des Transkripts
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    return new Response(JSON.stringify({ id: transcript.id, status: 'processing' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to start transcription', 
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}