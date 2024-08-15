import sys
import json
import requests
from pydub import AudioSegment
import io
import assemblyai as aai

# Ihre AssemblyAI API Key
aai.settings.api_key = "cfaa54df881e49298709396928b456a9"

def download_audio(url):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to download audio: HTTP {response.status_code}")
    return io.BytesIO(response.content)

def transcribe_audio(audio_file, language):
    transcriber = aai.Transcriber()
    config = aai.TranscriptionConfig(language_code=language)
    transcript = transcriber.transcribe(audio_file, config=config)
    return transcript.text

def main(url, language):
    try:
        audio_data = download_audio(url)
        
        # Konvertieren Sie das Audio in das richtige Format, falls nötig
        audio = AudioSegment.from_file(audio_data)
        audio_file = io.BytesIO()
        audio.export(audio_file, format="mp3")
        audio_file.seek(0)

        transcript = transcribe_audio(audio_file, language)
        print(json.dumps({"text": transcript}))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python3 transcribe_tiktok_audio.py <url> <language>"}), file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])