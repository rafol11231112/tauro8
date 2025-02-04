from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
import json
import os
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Stripe configuration
stripe.api_key = 'sk_test_51OQofSHGgwl4L4aF3XjdpXVc8OpHOQIobAsgVwU8ZwGWe2AqbIc8KymV6rf4VgqQ5URavCnYCNDIgHUH1JMLJ98G00cVHukVAU'

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "refaellugasi10@gmail.com"
SENDER_PASSWORD = "xhpy nded imfp ygtc"

def load_users():
    try:
        if os.path.exists('users.json'):
            with open('users.json', 'r') as f:
                return json.load(f)
        # If file doesn't exist, create it with empty array
        with open('users.json', 'w') as f:
            json.dump([], f)
        return []
    except Exception as e:
        print(f"Error loading users: {str(e)}")
        return []

def save_users(users):
    try:
        with open('users.json', 'w') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Error saving users: {str(e)}")

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(email, code):
    """Send verification code via email"""
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = email
        msg['Subject'] = 'Your Verification Code'
        
        body = f"""
        Your verification code is: {code}
        
        Please enter this code to complete your registration.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        Your Store Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send verification email: {str(e)}")
        return False

# Store pending registrations with verification codes
pending_verifications = {}

@app.route('/api/users/register', methods=['POST'])
def register_user():
    try:
        print("Received registration request")
        data = request.json
        print(f"Registration data: {data}")
        
        if not data or not all(k in data for k in ['email', 'password', 'fullname']):
            return jsonify({"success": False, "message": "Missing required fields"})

        users = load_users()
        
        # Check if email exists
        if any(user['email'] == data['email'].lower() for user in users):
            return jsonify({"success": False, "message": "Email already registered"})
        
        # Generate verification code
        verification_code = generate_verification_code()
        
        # Store pending registration
        pending_verifications[data['email'].lower()] = {
            "code": verification_code,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        # Send verification email
        if send_verification_email(data['email'], verification_code):
            print(f"Verification code sent to: {data['email']}")
            return jsonify({
                "success": True,
                "message": "Please check your email for verification code",
                "requiresVerification": True
            })
        else:
            return jsonify({"success": False, "message": "Failed to send verification email"})
            
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/users/verify', methods=['POST'])
def verify_registration():
    try:
        data = request.json
        email = data.get('email', '').lower()
        code = data.get('code', '')
        
        if not email or not code:
            return jsonify({"success": False, "message": "Missing email or verification code"})
            
        pending = pending_verifications.get(email)
        if not pending:
            return jsonify({"success": False, "message": "No pending verification found"})
            
        if pending['code'] != code:
            return jsonify({"success": False, "message": "Invalid verification code"})
            
        # Verification successful - create user
        users = load_users()
        new_user = {
            "fullname": pending['data']['fullname'],
            "email": email,
            "password": pending['data']['password'],
            "registeredDate": datetime.now().isoformat(),
            "purchases": []
        }
        users.append(new_user)
        save_users(users)
        
        # Remove pending verification
        del pending_verifications[email]
        
        print(f"User verified and registered: {email}")
        return jsonify({"success": True})
        
    except Exception as e:
        print(f"Verification error: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/users/login', methods=['POST'])
def verify_login():
    try:
        data = request.json
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"success": False, "message": "Missing email or password"})

        # Load users from json
        users = load_users()
        print(f"Checking login for email: {data['email']}")
        
        # Find user with matching email
        user = next((user for user in users if user['email'] == data['email'].lower()), None)
        
        if not user:
            print(f"User not found: {data['email']}")
            return jsonify({"success": False, "message": "Email not found"})
        
        if user['password'] != data['password']:
            print(f"Invalid password for user: {data['email']}")
            return jsonify({"success": False, "message": "Incorrect password"})
        
        print(f"User logged in successfully: {user['email']}")
        return jsonify({
            "success": True,
            "user": {
                "fullname": user['fullname'],
                "email": user['email']
            }
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

@app.route('/send-purchase-email', methods=['POST'])
def send_purchase_email():
    try:
        data = request.json
        recipient_email = data['customerEmail']
        product_name = data['product']
        order_id = data['orderId']
        item = data['item']
        
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = f'Your Purchase: {product_name} - Order #{order_id}'
        
        body = f"""
        Thank you for your purchase!
        
        Order Details:
        - Product: {product_name}
        - Order ID: #{order_id}
        
        Your Item:
        {item}
        
        Keep this email safe as it contains your purchased item.
        
        Best regards,
        Your Store Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"Email error: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"status": "API is working"})

@app.route('/create-stripe-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.json
        print("Creating Stripe session:", data)
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': data['product_name'],
                    },
                    'unit_amount': int(float(data['price']) * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=data['success_url'],
            cancel_url=data['cancel_url'],
            metadata={
                'order_id': data['order_id']
            }
        )
        
        print("Created session:", session.id)
        return jsonify({'id': session.id})
        
    except Exception as e:
        print("Stripe error:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        print("\n✨ API Server starting...")
        print("🌐 API Server URL: http://localhost:3000")
        app.run(host='localhost', port=3000, debug=True)
    except Exception as e:
        print(f"\n❌ Failed to start server: {str(e)}")
        input("\nPress Enter to exit...") 