from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(email, otp_code, mobile_number):
    """
    Send OTP verification code to user's email
    """
    subject = 'Verify Your Account'
    
    html_message = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
                line-height: 1.6;
            }}
            .container {{
                max-width: 500px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }}
            .header {{
                background-color: #000000;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }}
            .content {{
                padding: 40px 30px;
                text-align: center;
            }}
            .otp-code {{
                font-size: 48px;
                font-weight: bold;
                color: #000000;
                letter-spacing: 8px;
                padding: 20px;
                background-color: #f5f5f5;
                border-radius: 12px;
                margin: 20px 0;
                font-family: monospace;
            }}
            .info {{
                color: #666666;
                font-size: 14px;
                margin: 20px 0;
            }}
            .footer {{
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
                color: #999999;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Verify Your Account</h1>
            </div>
            <div class="content">
                <p style="font-size: 16px; color: #333;">Hello,</p>
                <p style="font-size: 16px; color: #333;">Use this verification code to complete your registration:</p>
                <div class="otp-code">{otp_code}</div>
                <p class="info">This code will expire in 10 minutes.</p>
                <p class="info">Phone number: <strong>{mobile_number}</strong></p>
                <p class="info">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    try:
        send_mail(
            subject,
            '',
            settings.DEFAULT_FROM_EMAIL or 'noreply@yourapp.com',
            [email],
            fail_silently=False,
            html_message=html_message
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def generate_tokens_for_user(user):
    """
    Generate JWT tokens for authenticated user
    """
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(user)
    
    refresh['mobile_number'] = user.mobile_number
    refresh['email'] = user.email
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }