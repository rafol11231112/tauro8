from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins

# Stripe configuration
stripe.api_key = 'sk_test_51OQofSHGgwl4L4aF3XjdpXVc8OpHOQIobAsgVwU8ZwGWe2AqbIc8KymV6rf4VgqQ5URavCnYCNDIgHUH1JMLJ98G00cVHukVAU'  # Replace with your secret key

@app.route('/create-stripe-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.json
        print("Creating session for:", data)
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': data['product_name'],
                    },
                    'unit_amount': int(float(data['price']) * 100),  # Convert to cents
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
        
        return jsonify({'id': session.id})
        
    except Exception as e:
        print("Error creating session:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/verify-stripe-session', methods=['POST'])
def verify_stripe_session():
    try:
        order_id = request.json.get('order_id')
        print("Verifying order:", order_id)

        if not order_id:
            return jsonify({'error': 'No order ID provided'}), 400

        # Get all sessions
        sessions = stripe.checkout.Session.list(limit=100)
        for session in sessions.data:
            if session.metadata.get('order_id') == order_id:
                print(f"Found session for order {order_id}, status: {session.payment_status}")
                
                if session.payment_status == 'paid':
                    # Get the payment intent to double check
                    payment_intent = stripe.PaymentIntent.retrieve(session.payment_intent)
                    print(f"Payment intent status: {payment_intent.status}")
                    
                    if payment_intent.status == 'succeeded':
                        return jsonify({'status': 'complete'})

        # If we get here, either session not found or payment not complete
        return jsonify({'status': 'pending'})
        
    except Exception as e:
        print('Verification error:', str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        print("\n✨ Stripe server starting...")
        print("💳 Server URL: http://localhost:3000")
        app.run(host='localhost', port=3000, debug=True)
    except Exception as e:
        print(f"\n❌ Failed to start server: {str(e)}")
        input("\nPress Enter to exit...") 