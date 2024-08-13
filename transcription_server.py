from flask import Flask, request, jsonify
from flask_cors import CORS
import assemblyai as aai

app = Flask(__name__)
CORS(app, resources={r"/transcribe": {"origins": "http://localhost:3000"}})

aai.settings.api_key = "cfaa54df881e49298709396928b456a9"

@app.route('/transcribe', methods=['POST', 'OPTIONS'])
def transcribe_audio():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    data = request.json
    file_url = data.get('file_url')
    
    if not file_url:
        return jsonify({"error": "No file URL provided"}), 400
    
    try:
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(file_url)
        
        if transcript.status == aai.TranscriptStatus.error:
            return jsonify({"error": str(transcript.error)}), 500
        else:
            return jsonify({"text": transcript.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)