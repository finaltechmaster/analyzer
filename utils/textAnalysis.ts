import OpenAI from 'openai';
import { AnalysisResult } from '../types/analysisTypes';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function performBigFiveAnalysis(text: string, language: string): Promise<AnalysisResult> {
  try {
    console.log('Performing Big Five analysis on text:', text.substring(0, 100) + '...');
    console.log('Detected language:', language);

    const isGerman = language.toLowerCase().includes('de');

    const prompt = isGerman
      ? `Analysiere den folgenden Text und gib eine Big Five Persönlichkeitseinschätzung ab. 
        Gib das Ergebnis als JSON-Objekt zurück. Verwende nur die folgenden Schlüssel: openness, conscientiousness, extraversion, agreeableness, neuroticism.
        Jeder Schlüssel sollte ein Objekt mit 'score' (0-100) und 'explanation' auf Deutsch enthalten.

        Text: ${text}

        Antwortformat:
        {
          "openness": { "score": 0, "explanation": "" },
          "conscientiousness": { "score": 0, "explanation": "" },
          "extraversion": { "score": 0, "explanation": "" },
          "agreeableness": { "score": 0, "explanation": "" },
          "neuroticism": { "score": 0, "explanation": "" }
        }`
      : `Analyze the following text and provide a Big Five personality assessment. 
        Return the result as a JSON object. Use only the following keys: openness, conscientiousness, extraversion, agreeableness, neuroticism.
        Each key should contain an object with 'score' (0-100) and 'explanation'.

        Text: ${text}

        Response format:
        {
          "openness": { "score": 0, "explanation": "" },
          "conscientiousness": { "score": 0, "explanation": "" },
          "extraversion": { "score": 0, "explanation": "" },
          "agreeableness": { "score": 0, "explanation": "" },
          "neuroticism": { "score": 0, "explanation": "" }
        }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI response:', response);

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse: AnalysisResult;
    try {
      // Versuche, nur den JSON-Teil der Antwort zu extrahieren
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in the response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse OpenAI response');
    }

    // Validate the parsed response
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    for (const trait of traits) {
      if (!parsedResponse[trait] || typeof parsedResponse[trait].score !== 'number' || typeof parsedResponse[trait].explanation !== 'string') {
        console.error(`Invalid data for trait: ${trait}`, parsedResponse[trait]);
        parsedResponse[trait] = { score: 0, explanation: 'Data not available' };
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error in performBigFiveAnalysis:', error);
    throw error;
  }
}