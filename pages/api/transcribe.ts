import { NextApiRequest, NextApiResponse } from 'next';
import AssemblyAI from 'assemblyai';

// Log the API key to verify it is being read correctly
console.log('AssemblyAI API Key:', process.env.ASSEMBLYAI_API_KEY);

const assembly = new AssemblyAI({
  token: process.env.ASSEMBLYAI_API_KEY || '', // Store your API key in an environment variable
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { video_url, language } = req.body;

      console.log('Received video URL:', video_url);
      console.log('Language:', language);

      const response = await assembly.transcribe({
        audio_url: video_url,
        language_code: language,
      });

      console.log('Transcription response:', response);

      if (response.error) {
        return res.status(500).json({ error: response.error });
      }

      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Caught error:', error);
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}