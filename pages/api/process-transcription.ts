import { NextRequest } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  console.log('Process Transcription API called');
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let requestId, video_url, language;
  try {
    ({ requestId, video_url, language } = await req.json());
  } catch (error) {
    console.error('Error parsing request:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!requestId || !video_url || !language) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`Processing transcription request ${requestId}`);

  try {
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    console.log(`Transcription ${requestId} completed, ID: ${transcript.id}`);

    return new Response(JSON.stringify({ status: 'completed', transcriptId: transcript.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error processing transcription ${requestId}:`, error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process transcription',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}