import { NextRequest } from 'next/server';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  console.log('Transcription status API called');
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing required parameter: id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Checking status for ID:', id);
    const transcript = await client.transcripts.get(id);
    console.log('Status:', transcript.status);
    
    if (transcript.status === 'completed') {
      return new Response(JSON.stringify({ status: 'completed', result: transcript }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (transcript.status === 'error') {
      return new Response(JSON.stringify({ status: 'error', error: transcript.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ status: 'processing' }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Detailed error in status check:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({ 
      error: 'Failed to check transcription status', 
      details: error instanceof Error ? error.message : JSON.stringify(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
