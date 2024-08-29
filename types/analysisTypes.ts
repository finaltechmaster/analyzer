export interface TraitResult {
  score: number;
  percentile: number;
  explanation: string; // Add this line
}

export interface AnalysisResult {
  openness: TraitResult;
  conscientiousness: TraitResult;
  extraversion: TraitResult;
  agreeableness: TraitResult;
  neuroticism: TraitResult;
}