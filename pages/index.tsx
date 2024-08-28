import { useState, FormEvent } from 'react';
import Image from 'next/image';
import axios from 'axios';
import styles from '../styles/Home.module.css';

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

export default function Home() {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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

  const analyzeSelectedVideos = async () => {
    console.log('Analyzing selected videos:', selectedVideos);
    if (selectedVideos.length === 0) {
      console.error('Bitte wählen Sie mindestens ein Video für die Analyse aus.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const transcribedVideos = await Promise.all(
        selectedVideos.map(async (index) => {
          const video = videos[index];
          const transcription = await getTranscription(video.videoUrl);
          return {
            ...video,
            transcription
          };
        })
      );

      setTranscriptions(transcribedVideos.map(v => v.transcription));

      const combinedText = transcribedVideos.map(v => 
        `${v.desc} ${v.caption} ${v.transcription}`
      ).join(' ');

      const analysis = performBigFiveAnalysis(combinedText + ' ' + (userData?.signature || ''));
      console.log('Analysis result:', analysis);
      setAnalysisResult(analysis);
    } catch (error) {
      console.error('Fehler bei der Analyse:', error);
      setError(`Fehler bei der Analyse: ${(error as Error).message}`);
    }

    setAnalyzing(false);
  };

  const getTranscription = async (videoUrl: string): Promise<string> => {
    console.log('Getting transcription for video URL:', videoUrl);
    try {
      // Schritt 1: Transkription starten
      const startResponse = await axios.post('/api/transcribe', { 
        video_url: videoUrl,
        language: 'de'
      });
      console.log('Start transcription response:', startResponse.data);
      
      if (startResponse.data && startResponse.data.requestId) {
        const requestId = startResponse.data.requestId;
        
        // Schritt 2: Transkription verarbeiten
        const processResponse = await axios.post('/api/process-transcription', {
          requestId,
          video_url: videoUrl,
          language: 'de'
        });
        console.log('Process transcription response:', processResponse.data);
        
        if (processResponse.data && processResponse.data.status === 'completed') {
          // Hier müssen Sie die Logik anpassen, um den tatsächlichen Transkriptionstext zu erhalten
          // Dies hängt davon ab, wie Ihre AssemblyAI-Integration den Text zurückgibt
          return processResponse.data.transcriptText || 'Transkription erfolgreich, Text nicht verfügbar';
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
          return `Transkription fehlgeschlagen: ${error.response.data.error}`;
        } else {
          return `Transkription fehlgeschlagen: ${error.message}`;
        }
      } else {
        return `Transkription fehlgeschlagen: ${(error as Error).message}`;
      }
    }
  };

  const performBigFiveAnalysis = (text: string): AnalysisResult => {
    // Vereinfachte Analyse für Demonstrationszwecke
    return {
      openness: Math.random(),
      conscientiousness: Math.random(),
      extraversion: Math.random(),
      agreeableness: Math.random(),
      neuroticism: Math.random()
    };
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
            <div key={index} className={styles.videoTranscript}>
              <h3>{videos[selectedVideos[index]].desc}</h3>
              <p><strong>Caption:</strong> {videos[selectedVideos[index]].caption}</p>
              <p><strong>Transkription:</strong> {transcription}</p>
            </div>
          ))}
        </div>
      )}

      {analysisResult && (
        <div className={styles.analysisResult}>
          <h2>Big-Five Persönlichkeitsanalyse</h2>
          <div className={styles.resultGrid}>
            <div className={styles.resultItem}>
              <h3>Offenheit für Erfahrungen</h3>
              <p>{(analysisResult.openness * 100).toFixed(2)}%</p>
            </div>
            <div className={styles.resultItem}>
              <h3>Gewissenhaftigkeit</h3>
              <p>{(analysisResult.conscientiousness * 100).toFixed(2)}%</p>
            </div>
            <div className={styles.resultItem}>
              <h3>Extraversion</h3>
              <p>{(analysisResult.extraversion * 100).toFixed(2)}%</p>
            </div>
            <div className={styles.resultItem}>
              <h3>Verträglichkeit</h3>
              <p>{(analysisResult.agreeableness * 100).toFixed(2)}%</p>
            </div>
            <div className={styles.resultItem}>
              <h3>Neurotizismus</h3>
              <p>{(analysisResult.neuroticism * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}