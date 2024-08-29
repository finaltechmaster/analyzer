import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { transcription, category, personalityTraits, language } = req.body;

  if (!transcription || !category || !personalityTraits || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const prompt = `Based on the following transcription and Big Five personality traits, generate a fun and engaging ${category} insight for the person in ${language}:

Transcription: ${transcription}

Big Five Traits:
Openness: ${personalityTraits.openness}
Conscientiousness: ${personalityTraits.conscientiousness}
Extraversion: ${personalityTraits.extraversion}
Agreeableness: ${personalityTraits.agreeableness}
Neuroticism: ${personalityTraits.neuroticism}

Please provide a ${category} insight that is entertaining, slightly exaggerated, and tailored to the person's personality. Keep it light-hearted and humorous, but not offensive. The response should be in ${language}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are a witty assistant that provides entertaining personality insights based on TikTok video transcriptions and Big Five personality traits. Always respond in ${language}.` },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.2, // Reduzieren Sie diesen Wert von 0.8 auf 0.2 für konsistentere Ergebnisse
    });

    const insight = completion.choices[0].message.content?.trim();

    res.status(200).json({ insight });
  } catch (error) {
    console.error('Error generating insight:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
}
