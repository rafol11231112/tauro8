from http.server import BaseHTTPRequestHandler
import json
import stripe
import resend
from datetime import datetime
import os

# Configurations
STRIPE_KEY = 'sk_test_51OQofSHGgwl4L4aF3XjdpXVc8OpHOQIobAsgVwU8ZwGWe2AqbIc8KymV6rf4VgqQ5URavCnYCNDIgHUH1JMLJ98G00cVHukVAU'
RESEND_API_KEY = os.environ.get('re_EdwiqeKY_4Bt7YxvXXQG8RMdVTiC7mwke', 'default_key')
SENDER_EMAIL = "onboarding@resend.dev"  # This is your verified sender
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "password123"

# Initialize APIs
stripe.api_key = STRIPE_KEY
resend.api_key = RESEND_API_KEY

def send_email(to_email, subject, body):
    try:
        print(f"Attempting to send email to: {to_email}")
        
        params = {
            "from": SENDER_EMAIL,
            "to": to_email,
            "subject": subject,
            "text": body
        }
        
        response = resend.Emails.send(params)
        print("Email sent successfully!", response)
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            response_data = {}
            
            # Auth endpoints
            if self.path == '/api/auth/register':
                email = data.get('email', '').lower()
                password = data.get('password')
                fullname = data.get('fullname')
                
                # Send welcome email
                welcome_subject = "Welcome to Your Store!"
                welcome_body = f"""
Dear {fullname},

Thank you for registering at Your Store! Your account has been successfully created.

Your login details:
Email: {email}

Best regards,
Your Store Team
                """
                
                if send_email(email, welcome_subject, welcome_body):
                    response_data = {
                        "success": True,
                        "user": {
                            "email": email,
                            "fullname": fullname
                        },
                        "message": "Registration successful! Check your email for confirmation."
                    }
                else:
                    response_data = {
                        "success": True,
                        "user": {
                            "email": email,
                            "fullname": fullname
                        },
                        "message": "Registration successful but failed to send welcome email."
                    }
                    
            elif self.path == '/api/auth/login':
                email = data.get('email', '').lower()
                password = data.get('password')
                
                response_data = {
                    "success": True,
                    "user": {
                        "email": email,
                        "fullname": email.split('@')[0]
                    }
                }
            
            # Purchase email endpoint
            elif self.path == '/api/send-purchase-email':
                email = data.get('customerEmail')
                product = data.get('product')
                order_id = data.get('orderId')
                item = data.get('item')
                
                purchase_subject = f"Your Purchase: {product} - Order #{order_id}"
                purchase_body = f"""
Thank you for your purchase!

Order Details:
- Product: {product}
- Order ID: #{order_id}

Your Item:
{item}

Keep this email safe as it contains your purchased item.

Best regards,
Your Store Team
                """
                
                if send_email(email, purchase_subject, purchase_body):
                    response_data = {"success": True, "message": "Purchase email sent"}
                else:
                    response_data = {"success": False, "message": "Failed to send purchase email"}
            
            # Stripe endpoint
            elif self.path == '/api/create-stripe-session':
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
                response_data = {'id': session.id}
            
            # Admin login endpoint
            elif self.path == '/api/admin/login':
                username = data.get('username')
                password = data.get('password')
                
                if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
                    response_data = {
                        "success": True,
                        "message": "Admin login successful"
                    }
                else:
                    response_data = {
                        "success": False,
                        "message": "Invalid credentials"
                    }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            print(f"Error processing request: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 
.
