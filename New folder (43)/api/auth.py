from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string

# Store users in memory (for demo - in production use a database)
USERS = []
PENDING_VERIFICATIONS = {}

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "refaellugasi10@gmail.com"
SENDER_PASSWORD = "xhpy nded imfp ygtc"

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email, code):
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = email
        msg['Subject'] = 'Your Verification Code'
        
        body = f"Your verification code is: {code}"
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        response_data = {}
        
        if self.path == '/api/auth/register':
            email = data.get('email', '').lower()
            password = data.get('password')
            fullname = data.get('fullname')
            
            # Check if email exists
            if any(user['email'] == email for user in USERS):
                response_data = {
                    "success": False,
                    "message": "Email already registered"
                }
            else:
                # Generate verification code
                code = generate_verification_code()
                PENDING_VERIFICATIONS[email] = {
                    "code": code,
                    "data": data,
                    "timestamp": datetime.now().isoformat()
                }
                
                if send_verification_email(email, code):
                    response_data = {
                        "success": True,
                        "requiresVerification": True,
                        "message": "Please check your email for verification code"
                    }
                else:
                    response_data = {
                        "success": False,
                        "message": "Failed to send verification email"
                    }
                    
        elif self.path == '/api/auth/verify':
            email = data.get('email', '').lower()
            code = data.get('code')
            
            pending = PENDING_VERIFICATIONS.get(email)
            if pending and pending['code'] == code:
                # Add user
                USERS.append({
                    "email": email,
                    "password": pending['data']['password'],
                    "fullname": pending['data']['fullname']
                })
                del PENDING_VERIFICATIONS[email]
                response_data = {"success": True}
            else:
                response_data = {
                    "success": False,
                    "message": "Invalid verification code"
                }
                
        elif self.path == '/api/auth/login':
            email = data.get('email', '').lower()
            password = data.get('password')
            
            user = next((u for u in USERS if u['email'] == email), None)
            if user and user['password'] == password:
                response_data = {
                    "success": True,
                    "user": {
                        "email": user['email'],
                        "fullname": user['fullname']
                    }
                }
            else:
                response_data = {
                    "success": False,
                    "message": "Invalid email or password"
                }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 