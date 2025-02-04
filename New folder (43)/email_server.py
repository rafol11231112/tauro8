from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "refaellugasi10@gmail.com"
SENDER_PASSWORD = "xhpy nded imfp ygtc"

@app.route('/')
def home():
    return "Email server is running!"

@app.route('/send-purchase-email', methods=['POST'])
def send_purchase_email():
    try:
        data = request.json
        logger.info(f"Received request: {data}")
        
        recipient_email = data.get('customerEmail')
        product_name = data.get('product')
        order_id = data.get('orderId')
        item = data.get('item')
        
        if not all([recipient_email, product_name, order_id, item]):
            logger.warning(f"Missing fields: email={recipient_email}, product={product_name}, order={order_id}")
            return jsonify({
                "success": False, 
                "message": "Missing required fields"
            }), 400
        
        # Create email content
        msg = MIMEMultipart()
        msg['From'] = f"Your Store <{SENDER_EMAIL}>"
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
        
        try:
            # Connect to SMTP server
            logger.info(f"Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}")
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                logger.info(f"Logging in as {SENDER_EMAIL}")
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                
                logger.info(f"Sending email to {recipient_email}")
                server.send_message(msg)
                
            logger.info("Email sent successfully!")
            return jsonify({"success": True, "message": "Email sent successfully"})
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Email authentication failed. Check email credentials."
            }), 500
            
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error occurred: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"SMTP error: {str(e)}"
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    try:
        print("\n✨ Email server starting...")
        print("📧 Server URL: http://localhost:8080")
        print("\n⚡ Press Ctrl+C to stop the server\n")
        app.run(host='localhost', port=8080, debug=True)
    except Exception as e:
        print(f"\n❌ Failed to start server: {str(e)}")
        input("\nPress Enter to exit...") 