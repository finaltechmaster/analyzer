import { NextApiRequest, NextApiResponse } from 'next';
import { performBigFiveAnalysis } from '../../utils/textAnalysis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, language } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing text' });
  }

  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing language' });
  }

  try {
    console.log('Analyzing text:', text.substring(0, 100) + '...');
    console.log('Language:', language);

    const analysisResult = await performBigFiveAnalysis(text, language);
    console.log('Analysis result:', analysisResult);

    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('Invalid analysis result');
    }

    res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({ error: 'Failed to analyze text', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}