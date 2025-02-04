from http.server import BaseHTTPRequestHandler
import json
import stripe

# Stripe configuration
stripe.api_key = 'sk_test_51OQofSHGgwl4L4aF3XjdpXVc8OpHOQIobAsgVwU8ZwGWe2AqbIc8KymV6rf4VgqQ5URavCnYCNDIgHUH1JMLJ98G00cVHukVAU'

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        try:
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

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = json.dumps({'id': session.id})
            self.wfile.write(response.encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = json.dumps({'error': str(e)})
            self.wfile.write(response.encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 