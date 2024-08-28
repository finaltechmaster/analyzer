import { NextRequest } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });

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

  try {
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    return new Response(JSON.stringify({ status: 'processing', transcriptId: transcript.id }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return new Response(JSON.stringify({ error: 'Failed to start transcription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}