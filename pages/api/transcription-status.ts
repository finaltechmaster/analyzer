import { NextApiRequest, NextApiResponse } from 'next';
import * as AssemblyAI from 'assemblyai';

if (!process.env.ASSEMBLYAI_API_KEY) {
  throw new Error('ASSEMBLYAI_API_KEY is not set in the environment variables');
}

const client = new AssemblyAI.Client(process.env.ASSEMBLYAI_API_KEY);

// This line has been removed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Transcription status API called');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  try {
    console.log('Checking status for ID:', id);
    const transcript = await client.transcripts.get(id as string);
    console.log('Status:', transcript.status);
    
    if (transcript.status === 'completed') {
      return res.status(200).json({ status: 'completed', result: transcript });
    } else if (transcript.status === 'error') {
      return res.status(500).json({ status: 'error', error: transcript.error });
    } else {
      return res.status(202).json({ status: 'processing' });
    }
  } catch (error) {
    console.error('Detailed error in status check:', JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      error: 'Failed to check transcription status', 
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
}
