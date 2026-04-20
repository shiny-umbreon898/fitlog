# Email Configuration Guide for Fitlog

## Overview
The Fitlog app sends a welcome email when users register. This guide explains how to set it up.

## Development Mode (Recommended for Testing)

### Option 1: Console Debug Mode (Quickest)
No SMTP server needed. Emails print to console instead of sending.

**Set environment variable:**
```bash
MAIL_DEBUG=true
```

**Result:** When a user registers, the email content prints to the Flask console:
```
============================================================
EMAIL DEBUG MODE (not sending)
============================================================
To: newuser@example.com
From: no-reply@fitlog.local
Subject: Welcome to Fitlog
------------------------------------------------------------
Hi newuser,

Welcome to Fitlog! We are excited to have you on board.

You can now log in and start tracking your workouts and meals.

Best regards,
The Fitlog Team
============================================================
```

---

### Option 2: Gmail SMTP (Real Email)
Send real emails using your Gmail account.

**Prerequisites:**
- Gmail account
- App-specific password (not your regular Gmail password)
  - Go to https://myaccount.google.com/apppasswords
  - Select "Mail" and "Windows Computer" (or your device)
  - Generate an app password (16-character code)

**Set environment variables:**
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM=your-email@gmail.com
```

**Example (.env file):**
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=fitlogtest@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM=fitlogtest@gmail.com
```

---

### Option 3: Local Test Mail Server (Mailhog)
Run a local SMTP server for testing without sending real emails.

**Install and run Mailhog:**
```bash
# On macOS:
brew install mailhog
mailhog

# On Windows (download binary or use Docker):
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or download exe from https://github.com/mailhog/MailHog/releases
# Then run: MailHog.exe
```

**Set environment variables:**
```bash
MAIL_HOST=localhost
MAIL_PORT=1025
```

**View emails:** Open browser to http://localhost:8025

---

## Production Setup

For production, use a transactional email service for reliability:

### SendGrid
```bash
# Use SendGrid's SMTP relay
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your-sendgrid-api-key
MAIL_FROM=noreply@yourdomain.com
```

### Mailgun
```bash
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=postmaster@yourdomain.mailgun.org
MAIL_PASSWORD=your-mailgun-password
MAIL_FROM=noreply@yourdomain.com
```

### AWS SES
```bash
MAIL_HOST=email-smtp.region.amazonaws.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-ses-username
MAIL_PASSWORD=your-ses-password
MAIL_FROM=noreply@yourdomain.com
```

---

## Setting Environment Variables

### For Development (using .env file)

1. Create or edit `.env` in the `backend/` directory:
```bash
cd backend
echo "MAIL_DEBUG=true" > .env
```

Or for Gmail (use one at a time):
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
```

2. Install python-dotenv (if not already installed):
```bash
pip install python-dotenv
```

3. Load .env in your Flask app startup (backend/run.py or backend/app/__init__.py):
```python
from dotenv import load_dotenv
load_dotenv()
```

---

### For Production (using system environment or Docker)

**Linux/macOS shell:**
```bash
export MAIL_HOST=smtp.example.com
export MAIL_PORT=587
# ... set other variables
python run.py
```

**Docker (in Dockerfile or docker-compose.yml):**
```yaml
environment:
  MAIL_HOST: smtp.example.com
  MAIL_PORT: 587
  MAIL_USERNAME: ${MAIL_USERNAME}
  MAIL_PASSWORD: ${MAIL_PASSWORD}
```

**Heroku:**
```bash
heroku config:set MAIL_HOST=smtp.example.com
heroku config:set MAIL_PORT=587
# ... set other variables
```

---

## Troubleshooting

### Emails not sending?

**Check the Flask console for messages:**
- `[MAIL] Email sent to user@example.com` - Email sent successfully
- `[MAIL] WARNING: Email not sent - MAIL_HOST or MAIL_PORT not configured` - Config missing
- `[MAIL] ERROR: Failed to send email to user@example.com: ...` - Connection error

**Common issues:**

1. **"MAIL_HOST or MAIL_PORT not configured"**
   - Set MAIL_DEBUG=true to test in console mode
   - Or configure MAIL_HOST and MAIL_PORT properly

2. **"Authentication failed" (Gmail)**
   - Use 16-character app password, not your Gmail password
   - Verify username matches your Gmail address

3. **"Connection refused" (Mailhog)**
   - Ensure Mailhog is running: `mailhog` (or Docker container)
   - Check MAIL_HOST=localhost and MAIL_PORT=1025

4. **"TLS error"**
   - For port 587, use MAIL_USE_TLS=true
   - For port 465, use MAIL_USE_SSL=true
   - For port 25, use neither

---

## Code Implementation

The welcome email is sent during user registration in `backend/app/routes.py`:

```python
# In create_user() endpoint, after successful commit:
try:
    send_welcome_email_async(user.email, user.username)
except Exception as e:
    print("Failed to trigger welcome email:", e)
```

The actual sending happens in `backend/app/email.py` in a background thread so registration stays fast.

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `backend/.env` (or create it)
- [ ] Choose development option (Debug mode, Gmail, or Mailhog)
- [ ] Set environment variables
- [ ] Restart Flask: `cd backend && python run.py`
- [ ] Register a test user
- [ ] Check Flask console for email confirmation message

