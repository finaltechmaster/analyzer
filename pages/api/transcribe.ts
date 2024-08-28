import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  console.log('Transcribe API called');
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let video_url, language;
  try {
    ({ video_url, language } = await req.json());
  } catch (error) {
    console.error('Error parsing request:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!video_url || !language) {
    return new Response(JSON.stringify({ error: 'Missing required fields: video_url or language' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log('Request received:', { video_url, language });

  // Generieren Sie eine eindeutige ID für diese Anfrage
  const requestId = Date.now().toString();

  // Hier würden Sie normalerweise die Transkriptionsanfrage in eine Datenbank oder Warteschlange einfügen
  console.log(`Transcription request ${requestId} queued for processing`);

  // Antworten Sie sofort
  return new Response(JSON.stringify({ status: 'queued', requestId }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
}