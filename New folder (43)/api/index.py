from flask import Flask, request, jsonify
import json
import stripe
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler

# Create Flask app
app = Flask(__name__)

# Configurations
STRIPE_KEY = os.getenv('STRIPE_SECRET_KEY')
stripe.api_key = STRIPE_KEY

def handler(request):
    if request.path == '/api/create-stripe-session' and request.method == 'POST':
        try:
            data = json.loads(request.body)
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
                    'order_id': data.get('order_id'),
                    'customer_email': data.get('customer_email', ''),
                    'item': data.get('item', '')
                }
            )
            return {
                'statusCode': 200,
                'body': json.dumps({'id': session.id})
            }
        except Exception as e:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': str(e)})
            }

    elif request.path == '/api/verify-stripe-payment' and request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
            if not order_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'No order ID provided'})
                }

            sessions = stripe.checkout.Session.list(limit=100)
            for session in sessions.data:
                if session.metadata.get('order_id') == order_id:
                    if session.payment_status == 'paid':
                        return {
                            'statusCode': 200,
                            'body': json.dumps({
                                'status': 'complete',
                                'message': 'Payment verified'
                            })
                        }
                    return {
                        'statusCode': 200,
                        'body': json.dumps({
                            'status': 'pending',
                            'message': 'Payment not yet completed'
                        })
                    }
            
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'status': 'not_found',
                    'message': 'Order not found'
                })
            }

        except Exception as e:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': str(e)})
            }

    return {
        'statusCode': 404,
        'body': json.dumps({'error': 'Not found'})
    }

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'API is running'}).encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        response = handler({
            'path': self.path,
            'method': 'POST',
            'body': post_data.decode('utf-8')
        })
        
        self.send_response(response['statusCode'])
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(response['body'].encode())

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port) 