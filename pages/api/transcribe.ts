import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

// Initialisieren des AssemblyAI-Clients
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in transcription process:', error);
    return res.status(500).json({ error: 'Internal server error: ' + (error as Error).message });
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