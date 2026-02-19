# Fast2SMS Setup Guide

## Current Status
✅ OTP system is working in **development mode**
⚠️ SMS delivery requires Fast2SMS API key configuration

## What's Working Now
- Users can request OTP
- OTP is generated and stored in database
- OTP is logged in backend logs: `/var/log/supervisor/backend.err.log`
- OTP verification works correctly
- In development, you can find the OTP in logs and use it to login

## To Enable SMS Delivery

### Step 1: Get Fast2SMS API Key
1. Go to https://www.fast2sms.com
2. Sign up for an account
3. Navigate to Dashboard → API
4. Copy your API Key

### Step 2: Configure Backend
1. Open `/app/backend/.env`
2. Add your Fast2SMS API key:
   ```
   FAST2SMS_API_KEY="your-actual-api-key-here"
   ```
3. Restart backend: `sudo supervisorctl restart backend`

### Step 3: Test SMS Delivery
After adding the API key, when users request OTP:
- OTP will be sent via SMS to their mobile number
- They'll receive a message with the 6-digit code
- The template ID used is: `201186` (DLT approved)

## Alternative SMS Providers
If Fast2SMS doesn't work, you can modify `/app/backend/server.py` to use:
- Twilio
- MSG91
- TextLocal
- Any other SMS gateway

## Development Mode
Until you add the API key:
- OTP will still be generated
- Check backend logs for OTP: `tail -f /var/log/supervisor/backend.err.log | grep OTP`
- Use the logged OTP for testing

## Important Notes
1. Fast2SMS requires DLT registration for production use in India
2. Current template ID: `201186` - ensure it matches your DLT template
3. Sender ID: `SIBPLR` - update if you have a different one
4. The system works without SMS in development for testing
