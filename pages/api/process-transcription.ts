import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY as string });

// Entfernen Sie diese Zeile, falls sie noch vorhanden ist
// export const config = { runtime: 'edge' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Process Transcription API called');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { requestId, video_url, language } = req.body;

  if (!requestId || !video_url || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`Processing transcription request ${requestId}`);

  try {
    const transcript = await client.transcripts.create({
      audio_url: video_url,
      language_code: language,
    });

    console.log(`Transcription ${requestId} started, ID: ${transcript.id}`);

    // Warten auf die Fertigstellung der Transkription
    let completedTranscript;
    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Warte 5 Sekunden
      completedTranscript = await client.transcripts.get(transcript.id);
      console.log(`Transcription status: ${completedTranscript.status}`);
    } while (completedTranscript.status === 'queued' || completedTranscript.status === 'processing');

    if (completedTranscript.status === 'completed') {
      console.log('Completed transcript:', completedTranscript);
      return res.status(200).json({ 
        status: 'completed', 
        transcriptId: completedTranscript.id,
        transcriptText: completedTranscript.text
      });
    } else {
      throw new Error(`Transcription failed with status: ${completedTranscript.status}`);
    }
  } catch (error) {
    console.error(`Error processing transcription ${requestId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to process transcription',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
}