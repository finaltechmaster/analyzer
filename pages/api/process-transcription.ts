import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not set in the environment variables');
}

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Process Transcription API called');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { transcriptId } = req.body;

  if (!transcriptId) {
    return res.status(400).json({ error: 'Missing required field: transcriptId' });
  }

  console.log('Processing transcription request', transcriptId);

  try {
    let transcript = await client.transcripts.get(transcriptId);

    while (transcript.status !== 'completed' && transcript.status !== 'error') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      transcript = await client.transcripts.get(transcriptId);
    }

    if (transcript.status === 'error') {
      throw new Error('Transcription failed: ' + transcript.error);
    }

    console.log('Transcription completed:', transcript);

    return res.status(200).json({ 
      status: 'completed', 
      transcriptText: transcript.text 
    });
  } catch (error) {
    console.error('Error processing transcription:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: 'Failed to process transcription', details: error.message });
    } else {
      return res.status(500).json({ error: 'Failed to process transcription', details: 'Unknown error' });
    }
  }
}