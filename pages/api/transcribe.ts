import { AssemblyAI } from 'assemblyai';

// Log the API key to verify it is being read correctly
console.log('AssemblyAI API Key:', process.env.ASSEMBLYAI_API_KEY);

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { video_url, language } = req.body;

      console.log('Received video URL:', video_url);
      console.log('Language:', language);

      const transcript = await client.transcripts.create({
        audio_url: video_url,
        language_code: language,
      });

      console.log('Transcription response:', transcript);

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