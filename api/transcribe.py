from http.server import BaseHTTPRequestHandler
import json
import assemblyai as aai

# Setzen Sie Ihren AssemblyAI API-Schlüssel
aai.settings.api_key = "cfaa54df881e49298709396928b456a9"

def transcribe_audio(url, language='de'):
    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(url, language_code=language)
    return transcript.text

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        video_url = data.get('video_url')
        language = data.get('language', 'de')
        
        if not video_url:
            self.send_error(400, "No video URL provided")
            return
        
        try:
            transcription = transcribe_audio(video_url, language)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = json.dumps({"text": transcription})
            self.wfile.write(response.encode())
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write("Transcription service is running. Use POST to transcribe.".encode())