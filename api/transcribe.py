from http.server import BaseHTTPRequestHandler
import json

def handle_request(handler):
    handler.send_response(200)
    handler.send_header('Content-type', 'application/json')
    handler.end_headers()
    response = json.dumps({"message": "Hello from the serverless function!"})
    handler.wfile.write(response.encode())

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        handle_request(self)
    
    def do_POST(self):
        handle_request(self)