from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os
import socket
import threading
import logging

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)

    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        logging.info(f"{self.address_string()} - {format%args}")

def get_free_port():
    """Get a free port on localhost"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

def start_server(port):
    """Start the HTTP server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHandler)
    print(f"\n✨ Server running at http://localhost:{port}")
    print("📁 Serving files from:", os.getcwd())
    print("\n🔍 Available pages:")
    print(f"  • Home page: http://localhost:{port}/index.html")
    print(f"  • Admin panel: http://localhost:{port}/admin.html")
    print(f"  • Customer login: http://localhost:{port}/customer-login.html")
    print("\n⚡ Press Ctrl+C to stop the server\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        httpd.server_close()

def check_files():
    """Check if all required files exist"""
    required_files = [
        'index.html',
        'styles.css',
        'script.js',
        'admin.html',
        'admin-styles.css',
        'admin.js',
        'customer-login.html',
        'customer-login.js'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("⚠️  Warning: The following files are missing:")
        for file in missing_files:
            print(f"  • {file}")
        return False
    return True

def main():
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    print("\n🌐 Starting web server...")
    
    # Use fixed port 8000
    port = 8000
    
    # Start the server in a separate thread
    server_thread = threading.Thread(target=start_server, args=(port,))
    server_thread.daemon = True
    server_thread.start()

    # Open the browser
    webbrowser.open(f'http://localhost:{port}/index.html')

    try:
        server_thread.join()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")

if __name__ == '__main__':
    main() 