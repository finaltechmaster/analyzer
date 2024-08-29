export interface TraitResult {
    score: number;
    explanation: string;
  }
  
  export interface AnalysisResult {
    openness: TraitResult;
    conscientiousness: TraitResult;
    extraversion: TraitResult;
    agreeableness: TraitResult;
    neuroticism: TraitResult;
  }