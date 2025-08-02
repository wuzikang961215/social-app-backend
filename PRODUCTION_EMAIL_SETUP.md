# Production Email Setup Guide

## Current Status
The email service is implemented but needs configuration in production.

## Option 1: Gmail (Quick MVP Setup)
**Pros**: Free, quick setup
**Cons**: 500 emails/day limit, might go to spam

### Setup Steps:
1. Enable 2FA on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Set Fly.io secrets:
```bash
fly secrets set EMAIL_HOST="smtp.gmail.com"
fly secrets set EMAIL_PORT="587"
fly secrets set EMAIL_USER="your-email@gmail.com"
fly secrets set EMAIL_PASS="your-16-char-app-password"
fly secrets set EMAIL_FROM="Yodda Social <your-email@gmail.com>"
```

## Option 2: SendGrid (Recommended)
**Pros**: 100 emails/day free, better deliverability
**Cons**: Requires account setup

### Setup Steps:
1. Sign up at https://sendgrid.com
2. Verify your email
3. Create API Key (Settings → API Keys)
4. Set Fly.io secrets:
```bash
fly secrets set EMAIL_HOST="smtp.sendgrid.net"
fly secrets set EMAIL_PORT="587"
fly secrets set EMAIL_USER="apikey"
fly secrets set EMAIL_PASS="your-sendgrid-api-key"
fly secrets set EMAIL_FROM="Yodda Social <noreply@yodda.social>"
```

## Option 3: Postmark (Best for Transactional)
**Pros**: Great for transactional emails, 100 emails/month free
**Cons**: Strictly transactional only

### Setup Steps:
1. Sign up at https://postmarkapp.com
2. Get SMTP credentials from Servers → SMTP
3. Set Fly.io secrets:
```bash
fly secrets set EMAIL_HOST="smtp.postmarkapp.com"
fly secrets set EMAIL_PORT="587"
fly secrets set EMAIL_USER="your-postmark-token"
fly secrets set EMAIL_PASS="your-postmark-token"
fly secrets set EMAIL_FROM="noreply@yodda.social"
```

## Option 4: AWS SES (Scalable)
**Pros**: Very cheap at scale, reliable
**Cons**: Complex setup, needs domain verification

## Testing Your Setup

1. After setting secrets, deploy:
```bash
fly deploy
```

2. Test password reset:
- Go to your app's login page
- Click "Forgot Password"
- Enter a registered email
- Check inbox (and spam folder)

3. Check logs if email doesn't arrive:
```bash
fly logs
```

## Domain Email Setup (Professional)

To send from @yodda.social:
1. Add domain to your email provider
2. Add DNS records:
   - SPF: `TXT @ "v=spf1 include:sendgrid.net ~all"`
   - DKIM: (provided by email service)
   - DMARC: `TXT _dmarc "v=DMARC1; p=none; rua=mailto:admin@yodda.social"`

## Quick Start (5 minutes)

For immediate setup, use Gmail:
```bash
# Replace with your values
fly secrets set EMAIL_HOST="smtp.gmail.com" \
  EMAIL_PORT="587" \
  EMAIL_USER="your.email@gmail.com" \
  EMAIL_PASS="your-app-password" \
  EMAIL_FROM="Yodda Social <your.email@gmail.com>"

# Deploy
fly deploy
```

## Troubleshooting

1. **Emails going to spam**: 
   - Use a proper FROM address
   - Add SPF/DKIM records
   - Use SendGrid/Postmark

2. **Connection refused**:
   - Check EMAIL_HOST and EMAIL_PORT
   - Ensure credentials are correct

3. **Authentication failed**:
   - For Gmail: Use App Password, not regular password
   - For SendGrid: Username must be "apikey"

## Current Implementation

The email service sends:
- Password reset emails (with 1-hour expiry)
- Welcome emails (optional)
- Event approval notifications

All emails are bilingual (Chinese/English) and mobile-responsive.