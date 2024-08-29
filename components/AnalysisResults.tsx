import React from 'react';
import styles from '../styles/Home.module.css';

interface TraitResult {
  score: number;
  explanation: string;
}

interface AnalysisResult {
  openness: TraitResult;
  conscientiousness: TraitResult;
  extraversion: TraitResult;
  agreeableness: TraitResult;
  neuroticism: TraitResult;
}

interface AnalysisResultsProps {
  results: AnalysisResult;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
  if (!results || Object.keys(results).length === 0) {
    return <p>Keine Analyseergebnisse verfügbar</p>;
  }

  const traits = [
    { key: 'openness', title: 'Offenheit für Erfahrungen', description: '(Kreativität, Wissbegierde, Offenheit für neue Erfahrungen)' },
    { key: 'conscientiousness', title: 'Gewissenhaftigkeit', description: '(Pflichtbewusstsein, Ordnungsliebe, Zuverlässigkeit)' },
    { key: 'extraversion', title: 'Extraversion', description: '(Geselligkeit, Energie, Durchsetzungsfähigkeit)' },
    { key: 'agreeableness', title: 'Verträglichkeit', description: '(Kooperationsbereitschaft, Mitgefühl, Rücksichtnahme)' },
    { key: 'neuroticism', title: 'Neurotizismus', description: '(emotionale Instabilität, Anfälligkeit für negative Emotionen)' },
  ];

  return (
    <div className={styles.analysisResult}>
      <h2>Persönlichkeitsanalyse</h2>
      <div className={styles.traitGrid}>
        {traits.map(trait => {
          const traitResult = results[trait.key as keyof AnalysisResult];
          return (
            <div key={trait.key} className={styles.traitItem}>
              <div className={styles.traitHeader}>
                <span className={styles.traitTitle}>{trait.title}</span>
                <span className={styles.traitDescription}>{trait.description}</span>
              </div>
              <div className={styles.traitScore}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${traitResult.score}%` }}
                  >
                    <span className={styles.progressText}>{traitResult.score}%</span>
                  </div>
                </div>
              </div>
              <p className={styles.traitExplanation}>{traitResult.explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisResults;