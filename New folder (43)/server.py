from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os
import json
import logging

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Make sure we serve from the public directory
        super().__init__(*args, directory="public", **kwargs)

    def end_headers(self):
        # Add CORS headers for all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            print(f"Received POST request to {self.path}")  # Debug log
            print(f"Data: {data}")  # Debug log

            # Handle login request
            if self.path == '/api/auth/login':
                if data.get('email') == 'admin@tauro.fo' and data.get('password') == 'Admin123!':
                    response = {
                        "success": True,
                        "user": {
                            "email": "admin@tauro.fo",
                            "fullname": "Admin User",
                            "isAdmin": True
                        }
                    }
                else:
                    response = {
                        "success": False,
                        "message": "Invalid email or password"
                    }
                
                print(f"Login response: {response}")  # Debug log
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                return

        except Exception as e:
            print(f"Error in do_POST: {str(e)}")  # Debug log
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": False,
                "message": f"Server error occurred: {str(e)}"
            }).encode())

def check_files():
    """Check if required files exist in public directory"""
    required_files = [
        'index.html',
        'css/styles.css',
        'js/script.js',
        'customer-login.html'
    ]
    
    missing = []
    for file in required_files:
        path = os.path.join('public', file)
        if not os.path.exists(path):
            missing.append(file)
    
    return missing

def main():
    # Check files first
    missing_files = check_files()
    if missing_files:
        print("\n❌ Error: Missing required files in public directory:")
        for file in missing_files:
            print(f"  • {file}")
        print("\nPlease make sure all files are in the correct location.")
        return

    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHandler)
    
    print("\n✨ Server running!")
    print(f"🌐 URL: http://localhost:{port}")
    print("📁 Serving files from: public/")
    print("\n📄 Try these pages:")
    print(f"  • Home: http://localhost:{port}/index.html")
    print(f"  • Login: http://localhost:{port}/customer-login.html")
    print("\n⚡ Press Ctrl+C to stop the server\n")

    # Open browser automatically
    webbrowser.open(f'http://localhost:{port}/index.html')

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"\n❌ Server error: {str(e)}")

if __name__ == '__main__':
    main() 