from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess

def play_music(music):
    with open('notes.json', 'w') as f:
        f.write(json.dumps(music))
    subprocess.run(["node", "/Users/eric/Workspace/midisender/playmidi.js", "notes.json"])
    return "Playing music"

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Print the request line and headers
        print(f"Request: {self.requestline}")
        print("Headers:")
        for header in self.headers:
            print(f"{header}: {self.headers[header]}")

        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        # Add CORS header to allow all origins
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'{"message": "Hey there, you go getter!"}')

    def do_POST(self):
        # Print the request line and headers
        # print(f"Request: {self.requestline}")
        body = self.rfile.read(int(self.headers['Content-Length'])).decode('utf-8')
        # read body json
        body = json.loads(body)
        # print(f"Body: {body}")
        music = body["music"]
        print(music)
        # play_music(music)

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        answer = f"hi, {body}"
        self.wfile.write(b'{"message": "Sending a reply, post-haste!"}')

    def do_OPTIONS(self):
        # Send response for OPTIONS request
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type')
        self.end_headers()

if __name__ == '__main__':
    port = 8251
    httpd = HTTPServer(('localhost', port), SimpleHTTPRequestHandler)
    print(f"Server started on localhost:{port}...")
    httpd.serve_forever()
