import React, { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { AlertCircle, Brain, Heart, Frown, Smile, DollarSign, Activity, Briefcase, Lightbulb } from 'lucide-react';
import styles from '../styles/Home.module.css';
import AnalysisResults from '../components/AnalysisResults';

interface UserData {
  id: string;
  uniqueId: string;
  nickname: string;
  signature: string;
  avatarThumb: string;
  stats: {
    followingCount: number;
    followerCount: number;
    heartCount: number;
    videoCount: number;
    diggCount: number;
  };
}

interface Video {
  id: string;
  desc: string;
  thumbnail: string;
  likes: number;
  comments: number;
  musicTitle: string;
  caption: string;
  videoUrl: string;
}

interface AnalysisResult {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface PersonalityInsights {
  roast: string;
  strengths: string;
  weaknesses: string;
  love_life: string;
  money: string;
  health: string;
  career: string;
  life_suggestion: string;
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [transcriptions, setTranscriptions] = useState<{ caption: string; transcription: string }[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [personalityInsights, setPersonalityInsights] = useState<PersonalityInsights | null>(null);

  const RAPIDAPI_KEY = '203e9f12b9msh183c5b2cbbbe6e1p11fbf6jsnd5bc216f80bf';
  const RAPIDAPI_HOST = 'tiktok-scraper7.p.rapidapi.com';

  const loadUserProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUserData(null);
    setVideos([]);
    setSelectedVideos([]);
    setAnalysisResult(null);
    setTranscriptions([]);
    setTranscriptionText('');
    setPersonalityInsights(null);

    try {
      const userData = await getUserData(username);
      console.log('User Data Response:', userData);
      setUserData(userData);

      const videosData = await getVideos(userData.id, 20); // Verwenden Sie die Benutzer-ID
      console.log('Videos Data Response:', videosData);
      setVideos(videosData);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      setError(`Fehler beim Laden der Daten: ${(error as Error).message}`);
    }

    setLoading(false);
  };

  const getUserData = async (username: string): Promise<UserData> => {
    const options = {
      method: 'GET',
      url: 'https://tiktok-scraper7.p.rapidapi.com/user/info',
      params: { unique_id: username, hd: '1' },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    try {
      const response = await axios.request(options);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.data) {
        const userData = response.data.data;
        return {
          id: userData.user.id, // Benutzer-ID extrahieren
          uniqueId: userData.user.uniqueId,
          nickname: userData.user.nickname,
          signature: userData.user.signature,
          avatarThumb: userData.user.avatarThumb,
          stats: {
            followingCount: userData.stats.followingCount,
            followerCount: userData.stats.followerCount,
            heartCount: userData.stats.heartCount,
            videoCount: userData.stats.videoCount,
            diggCount: userData.stats.diggCount
          }
        };
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error in getUserData:', error);
      throw new Error(`Failed to load user data: ${(error as Error).message}`);
    }
  };

  const getVideos = async (userId: string, count: number): Promise<Video[]> => {
    const options = {
      method: 'GET',
      url: 'https://tiktok-scraper7.p.rapidapi.com/user/posts',
      params: { user_id: userId, count: count.toString(), cursor: '0' },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    try {
      const response = await axios.request(options);
      console.log('API Videos Response:', response.data);
      
      if (response.data && response.data.data && Array.isArray(response.data.data.videos)) {
        return response.data.data.videos.map((video: any) => {
          console.log('Video Data:', video); // Debugging-Ausgabe
          return {
            id: video.video_id || '',
            desc: video.title || video.desc || 'Kein Titel',
            thumbnail: video.origin_cover || video.cover || '',
            likes: video.digg_count || 0,
            comments: video.comment_count || 0,
            musicTitle: video.music?.title || '',
            caption: video.desc || '',
            videoUrl: video.play || ''
          };
        });
      } else {
        throw new Error('Video-Daten konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Videos:', error);
      throw error;
    }
  };

  const toggleVideoSelection = (index: number) => {
    console.log('Toggling video selection for index:', index);
    setSelectedVideos(prev => {
      const isSelected = prev.includes(index);
      const newSelection = isSelected ? prev.filter(i => i !== index) : [...prev, index];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const analyzeText = async (text: string, language: string) => {
    try {
      const response = await axios.post('/api/analyze-text', { text, language });
      return response.data;
    } catch (error) {
      console.error('Error in analyzeText:', error);
      throw error;
    }
  };

  const analyzeSelectedVideos = async () => {
    if (selectedVideos.length === 0) {
      setError('Bitte wählen Sie mindestens ein Video für die Analyse aus.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const transcribedVideos = await Promise.all(
        selectedVideos.map(async (index) => {
          const video = videos[index];
          const transcriptionResult = await getTranscription(video.videoUrl);
          return {
            caption: video.desc, // Verwenden Sie die Beschreibung als Caption
            transcription: transcriptionResult.transcription,
            language: transcriptionResult.language
          };
        })
      );

      const newTranscriptions = transcribedVideos.map(v => ({
        caption: v.caption,
        transcription: v.transcription
      }));
      setTranscriptions(newTranscriptions);

      const combinedText = transcribedVideos.map(v => 
        `${v.caption} ${v.transcription}`
      ).join(' ');

      // Fügen Sie die Benutzerbio hinzu, wenn vorhanden
      const fullText = userData?.signature 
        ? `${userData.signature} ${combinedText}`
        : combinedText;

      console.log('Full text for analysis:', fullText);

      setTranscriptionText(fullText);

      const analysis = await analyzeText(fullText, transcribedVideos[0].language);
      console.log('Analysis result:', analysis);
      setAnalysisResult(analysis);

      // Hier geben wir die erkannte Sprache weiter
      await generateInsights(fullText, analysis, transcribedVideos[0].language);
    } catch (error) {
      console.error('Fehler bei der Analyse:', error);
      setError(`Fehler bei der Analyse: ${(error as Error).message}`);
    }

    setAnalyzing(false);
  };

  const generateInsights = async (text: string, personalityTraits: AnalysisResult, language: string) => {
    const insightCategories = ['roast', 'strengths', 'weaknesses', 'love_life', 'money', 'health', 'career', 'life_suggestion'];
    const insights: PersonalityInsights = {} as PersonalityInsights;

    for (const category of insightCategories) {
      try {
        const response = await axios.post('/api/generate-insights', {
          transcription: text,
          category,
          personalityTraits,
          language,
        });
        insights[category as keyof PersonalityInsights] = response.data.insight;
      } catch (error) {
        console.error(`Error generating ${category} insight:`, error);
        insights[category as keyof PersonalityInsights] = 'Failed to generate insight';
      }
    }

    setPersonalityInsights(insights);
  };

  const getTranscription = async (videoUrl: string): Promise<{ transcription: string, language: string }> => {
    console.log('Getting transcription for video URL:', videoUrl);
    try {
      // Schritt 1: Transkription starten
      const startResponse = await axios.post('/api/transcribe', { 
        video_url: videoUrl,
        language: 'de'
      });
      console.log('Start transcription response:', startResponse.data);
      
      if (startResponse.data && startResponse.data.transcriptId) {
        const transcriptId = startResponse.data.transcriptId;
        
        // Schritt 2: Transkription verarbeiten
        const processResponse = await axios.post('/api/process-transcription', {
          transcriptId,
        });
        console.log('Process transcription response:', processResponse.data);
        
        if (processResponse.data && processResponse.data.status === 'completed') {
          return {
            transcription: processResponse.data.transcriptText || 'Transkription erfolgreich, Text nicht verfügbar',
            language: startResponse.data.detectedLanguage
          };
        } else {
          throw new Error('Transkription nicht erfolgreich abgeschlossen');
        }
      } else {
        throw new Error('Keine Request-ID erhalten');
      }
    } catch (error) {
      console.error('Fehler bei der Transkription:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.toJSON());
        if (error.response?.data?.error) {
          return {
            transcription: `Transkription fehlgeschlagen: ${error.response.data.error}`,
            language: 'de'
          };
        } else {
          return {
            transcription: `Transkription fehlgeschlagen: ${error.message}`,
            language: 'de'
          };
        }
      } else {
        return {
          transcription: `Transkription fehlgeschlagen: ${(error as Error).message}`,
          language: 'de'
        };
      }
    }
  };

  // Hier solltest du deine Daten laden oder von einer API abrufen
  const analysisResults = {
    // Beispieldaten
    openness: {
      title: 'Offenheit',
      score: 75,
      matchedWords: ['neugierig', 'kreativ']
    },
    conscientiousness: {
      title: 'Gewissenhaftigkeit',
      score: 80,
      matchedWords: ['organisiert', 'zuverlässig']
    },
    // ... weitere Persönlichkeitsmerkmale
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TikTok Persönlichkeits-Analyzer</h1>
      <form onSubmit={loadUserProfile} className={styles.form}>
        <input
          type="text"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          placeholder="TikTok Benutzername"
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>Profil laden</button>
      </form>

      {loading && <p className={styles.loading}>Bitte warten, die Daten werden geladen...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {userData && (
        <div className={styles.userInfo}>
          <Image
            src={userData.avatarThumb}
            alt={userData.nickname}
            width={100}
            height={100}
            className={styles.avatar}
          />
          <div className={styles.userDetails}>
            <h2>{userData.nickname} (@{userData.uniqueId})</h2>
            <p className={styles.signature}>{userData.signature}</p>
            <div className={styles.stats}>
              <span>Follower: {userData.stats.followerCount.toLocaleString()}</span>
              <span>Following: {userData.stats.followingCount.toLocaleString()}</span>
              <span>Likes: {userData.stats.heartCount.toLocaleString()}</span>
              <span>Videos: {userData.stats.videoCount}</span>
            </div>
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className={styles.videoSection}>
          <h3>Wählen Sie Videos für die Analyse:</h3>
          <div className={styles.videoGrid}>
            {videos.map((video, index) => (
              <div
                key={video.id}
                className={`${styles.videoItem} ${selectedVideos.includes(index) ? styles.selected : ''}`}
                onClick={() => toggleVideoSelection(index)}
              >
                <div className={styles.thumbnailContainer}>
                  <Image
                    src={video.thumbnail}
                    alt={video.desc}
                    layout="fill"
                    objectFit="cover"
                    className={styles.thumbnail}
                  />
                </div>
                <div className={styles.videoInfo}>
                  <p className={styles.videoTitle}>{video.desc}</p>
                  <p className={styles.videoStats}>
                    ❤️ {video.likes.toLocaleString()} | 💬 {video.comments.toLocaleString()}
                  </p>
                  <p className={styles.videoCaption}>{video.caption}</p>
                </div>
                {selectedVideos.includes(index) && <div className={styles.checkmark}>✓</div>}
              </div>
            ))}
          </div>
          <button onClick={analyzeSelectedVideos} className={styles.analyzeButton} disabled={analyzing}>
            {analyzing ? 'Analyse läuft...' : 'Ausgewählte Videos analysieren'}
          </button>
          {analyzing && <div className={styles.loader}></div>}
        </div>
      )}

      {transcriptions.length > 0 && (
        <div className={styles.transcriptResult}>
          <h2>Analysierte Videos:</h2>
          {transcriptions.map((transcription, index) => (
            <div key={index} className={`${styles.videoTranscript} ${index % 2 === 0 ? styles.evenVideo : styles.oddVideo}`}>
              <h3>Video {index + 1}</h3>
              <p><strong>Caption:</strong> {transcription.caption}</p>
              <p><strong>Transkription:</strong> {transcription.transcription}</p>
            </div>
          ))}
        </div>
      )}

      {analysisResult && (
        <AnalysisResults results={analysisResult} />
      )}

      {personalityInsights && (
        <div className={styles.insightsContainer}>
          <h2>Persönlichkeits-Insights</h2>
          <div className={styles.insightsGrid}>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3>Roast</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.roast}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <Smile className="h-6 w-6 text-green-500" />
                <h3>Stärken</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.strengths}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <Frown className="h-6 w-6 text-yellow-500" />
                <h3>Schwächen</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.weaknesses}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <Heart className="h-6 w-6 text-pink-500" />
                <h3>Liebesleben</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.love_life}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <DollarSign className="h-6 w-6 text-green-500" />
                <h3>Geld</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.money}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <Activity className="h-6 w-6 text-blue-500" />
                <h3>Gesundheit</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.health}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <Briefcase className="h-6 w-6 text-purple-500" />
                <h3>Karriere</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.career}</div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                <h3>Lebensvorschlag</h3>
              </div>
              <div className={styles.insightContent}>{personalityInsights.life_suggestion}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}