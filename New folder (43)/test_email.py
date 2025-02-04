from api.index import send_email

def test_email():
    test_email = "your_test_email@gmail.com"  # Replace with your email
    subject = "Test Email"
    body = "This is a test email from Your Store"
    
    print("Starting email test...")
    result = send_email(test_email, subject, body)
    
    if result:
        print("✅ Email test successful!")
    else:
        print("❌ Email test failed!")

if __name__ == "__main__":
    test_email() 