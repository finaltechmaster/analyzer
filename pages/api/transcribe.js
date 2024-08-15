import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { video_url, language } = req.body;
      
      console.log('Received video URL:', video_url);
      console.log('Language:', language);
      console.log('Executing Python script...');
      
      const { stdout, stderr } = await execAsync(`python3 transcribe_tiktok_audio.py "${video_url}" "${language}"`, { timeout: 60000 });
      
      console.log('Python script completed');
      console.log('stdout:', stdout);

      // Ignoriere die Warnung und prüfe nur auf tatsächliche Fehler
      if (stderr && !stderr.includes('NotOpenSSLWarning')) {
        console.error('Python script error:', stderr);
        return res.status(500).json({ error: 'Transcription failed: ' + stderr });
      }

      const transcript = JSON.parse(stdout);
      if (transcript.error) {
        return res.status(500).json({ error: transcript.error });
      }
      return res.status(200).json(transcript);
    } catch (error) {
      console.error('Caught error:', error);
      if (error.code === 'ETIMEDOUT') {
        return res.status(504).json({ error: 'Transcription timed out' });
      }
      return res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}