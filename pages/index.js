import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const RAPIDAPI_KEY = '203e9f12b9msh183c5b2cbbbe6e1p11fbf6jsnd5bc216f80bf';
  const RAPIDAPI_HOST = 'tiktok-video-no-watermark2.p.rapidapi.com';

  const loadUserProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUserData(null);
    setVideos([]);
    setSelectedVideos([]);
    setAnalysisResult(null);

    try {
      const userData = await getUserData(username);
      setUserData(userData.data);

      const videosData = await getVideos(username, 20);
      setVideos(videosData.data.videos);
    } catch (error) {
      setError(`Fehler beim Laden der Daten: ${error.message}`);
    }

    setLoading(false);
  };

  const getUserData = async (username) => {
    const options = {
      method: 'GET',
      url: 'https://tiktok-video-no-watermark2.p.rapidapi.com/user/info',
      params: {unique_id: username, hd: '1'},
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    return response.data;
  };

  const getVideos = async (username, count) => {
    const options = {
      method: 'GET',
      url: 'https://tiktok-video-no-watermark2.p.rapidapi.com/user/posts',
      params: {unique_id: username, count: count},
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    return response.data;
  };

  const toggleVideoSelection = async (index) => {
    const newSelectedVideos = [...selectedVideos];
    const videoIndex = newSelectedVideos.findIndex(v => v.video_id === videos[index].video_id);
    
    if (videoIndex > -1) {
      newSelectedVideos.splice(videoIndex, 1);
    } else {
      const video = videos[index];
      if (!video.transcription) {
        video.transcription = await simulateTranscription(video.title);
      }
      newSelectedVideos.push(video);
    }
    
    setSelectedVideos(newSelectedVideos);
  };

  const simulateTranscription = async (videoTitle) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Transkription für "${videoTitle}": Dies ist eine simulierte Transkription des Videos. In einem realen Szenario würde hier der tatsächliche Inhalt des Videos stehen, transkribiert von einer KI.`;
  };

  const analyzeSelectedVideos = () => {
    if (selectedVideos.length === 0) {
      alert('Bitte wählen Sie mindestens ein Video für die Analyse aus.');
      return;
    }

    const analysis = performAnalysis(selectedVideos);
    setAnalysisResult(analysis);
  };

  const performAnalysis = (videos) => {
    const allText = videos.map(v => `${v.title} ${v.transcription || ''}`).join(' ');
    const wordCount = allText.split(/\s+/).length;

    const keywordCounts = {
      Kreativität: (allText.match(/kreativ|inspirierend|originell|künstlerisch/gi) || []).length,
      Humor: (allText.match(/lustig|witzig|komisch|lachen/gi) || []).length,
      Information: (allText.match(/informativ|lehrreich|wissenswert|erklären/gi) || []).length,
      Lifestyle: (allText.match(/lifestyle|leben|alltag|routine/gi) || []).length,
      Motivation: (allText.match(/motivierend|inspirierend|antreibend|ermutigen/gi) || []).length
    };

    const dominantTrait = Object.entries(keywordCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return {
      dominantTrait,
      traits: Object.fromEntries(
        Object.entries(keywordCounts).map(([trait, count]) => [trait, (count / wordCount * 100).toFixed(2) + '%'])
      ),
      contentType: determineDominantContentType(keywordCounts),
      averageVideoLength: (videos.reduce((sum, video) => sum + (video.duration || 0), 0) / videos.length).toFixed(2) + ' Sekunden'
    };
  };

  const determineDominantContentType = (keywordCounts) => {
    const maxCount = Math.max(...Object.values(keywordCounts));
    const dominantTypes = Object.entries(keywordCounts)
      .filter(([, count]) => count === maxCount)
      .map(([type]) => type);
    
    return dominantTypes.length > 1 ? 'Gemischt' : dominantTypes[0];
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TikTok Persönlichkeits-Analyzer</h1>
      <form onSubmit={loadUserProfile} className={styles.form}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="TikTok Benutzername"
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>Profil laden</button>
      </form>

      {loading && <p>Lade Daten...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {userData && (
        <div className={styles.userInfo}>
          <img src={userData.user.avatarLarger || userData.user.avatarMedium || userData.user.avatarThumb || ''} alt={userData.user.nickname || 'Benutzer'} />
          <div>
            <h2>{userData.user.nickname || 'Unbekannt'} (@{userData.user.uniqueId || 'unbekannt'})</h2>
            <p>{userData.user.signature || ''}</p>
            <p>Follower: {userData.stats.followerCount?.toLocaleString() || 0} | 
               Following: {userData.stats.followingCount?.toLocaleString() || 0} | 
               Likes: {userData.stats.heartCount?.toLocaleString() || 0}</p>
            <p>Video-Anzahl: {userData.stats.videoCount || 0}</p>
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className={styles.videoList}>
          <h3>Wählen Sie Videos für die Analyse:</h3>
          <div className={styles.videoGrid}>
            {videos.map((video, index) => (
              <div
                key={video.video_id}
                className={`${styles.videoItem} ${selectedVideos.some(v => v.video_id === video.video_id) ? styles.selected : ''}`}
                onClick={() => toggleVideoSelection(index)}
              >
                <img src={video.cover || ''} alt="Video Thumbnail" />
                <div className={styles.caption}>{video.title || 'Kein Titel'}</div>
                {selectedVideos.some(v => v.video_id === video.video_id) && (
                  <div className={styles.transcription}>{video.transcription || 'Transkribiere...'}</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={analyzeSelectedVideos} className={styles.button}>Ausgewählte Videos analysieren</button>
        </div>
      )}

      {analysisResult && (
        <div className={styles.result}>
          <h2>Persönlichkeits- und Inhaltsanalyse</h2>
          <p><strong>Dominanter Charakterzug:</strong> {analysisResult.dominantTrait}</p>
          <p><strong>Inhaltliche Ausrichtung:</strong></p>
          <ul>
            {Object.entries(analysisResult.traits).map(([trait, value]) => (
              <li key={trait}>{trait}: {value}</li>
            ))}
          </ul>
          <p><strong>Primärer Content-Typ:</strong> {analysisResult.contentType}</p>
          <p><strong>Durchschnittliche Videolänge:</strong> {analysisResult.averageVideoLength}</p>
        </div>
      )}
    </div>
  );
}
