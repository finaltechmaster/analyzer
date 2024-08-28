import { NextApiRequest, NextApiResponse } from 'next';
import { AssemblyAI } from 'assemblyai';

const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY || '' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { video_url, language } = req.body;

      console.log('Received video URL:', video_url);
      console.log('Language:', language);

      const transcript = await assembly.transcripts.create({
        audio_url: video_url,
        language_code: language,
      });

      console.log('Transcription response:', transcript);

      if ('error' in transcript) {
        return res.status(500).json({ error: transcript.error });
      }

      return res.status(200).json(transcript);
    } catch (error: any) {
      console.error('Caught error:', error);
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}