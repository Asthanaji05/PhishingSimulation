# Email Click Tracking System for Security Training

A Node.js-based email click tracking system designed for organizational phishing simulation and security awareness training. Track who clicks suspicious links, analyze behavior patterns, and identify users who need additional security training.

## Features

- **Bulk Email Sending**: Send phishing simulation emails with unique tracking links
- **Click Tracking**: Log email address, IP address, timestamp, and user agent for each click
- **Campaign Management**: Create and manage multiple phishing simulation campaigns
- **Analytics Dashboard**: View click rates, identify vulnerable users, and generate reports
- **Training Page**: Automatic redirect to security awareness training after clicking
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **CSV Reports**: Export click data for management review

## Prerequisites

- Node.js (v14 or higher)
- Supabase account (database provided automatically)
- SMTP server credentials (Gmail, SendGrid, or similar)

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase credentials (provided automatically if using Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server Configuration
TRACKING_BASE_URL=http://localhost:3000
SERVER_PORT=3000
```

### SMTP Setup (Gmail Example)

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use the generated password in `SMTP_PASS`

## Database Setup

The database schema is automatically created with the following tables:

- **recipients**: Stores email recipients with optional name and department
- **campaigns**: Stores campaign details (name, subject, body, status)
- **click_events**: Logs all click events with IP, timestamp, and user agent

Row Level Security (RLS) is enabled to protect data access.

## Usage

### 1. Start the Tracking Server

```bash
npm start
# or
node server.js
```

The server will run on port 3000 (configurable in .env).

### 2. Add Recipients

Edit `examples/addRecipients.js` with your recipient list, then run:

```bash
npm run add-recipients
# or
node examples/addRecipients.js
```

Recipients can be added as:
- Objects: `{ email, name, department }`
- Strings: `'email@example.com'`

### 3. Create a Campaign

Edit `examples/createCampaign.js` to customize your email template, then run:

```bash
npm run create-campaign
# or
node examples/createCampaign.js
```

The email template supports placeholders:
- `{{name}}` - Recipient name or email
- `{{email}}` - Recipient email address
- `{{tracking_url}}` - Unique tracking link

### 4. Send the Campaign

Use the campaign ID from step 3:

```bash
node examples/sendCampaign.js <campaign-id>
```

To send to specific recipients:

```bash
node examples/sendCampaign.js <campaign-id> user1@example.com,user2@example.com
```

### 5. View Analytics

```bash
npm run view-report
# or
node examples/viewReport.js
```

## API Endpoints

The tracking server provides the following endpoints:

### Tracking

- `GET /track/:token` - Track click event and redirect to training page

### Campaigns

- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `GET /api/campaigns/:id/stats` - Get campaign statistics
- `GET /api/campaigns/:id/clicks` - Get all clicks for a campaign

### Recipients & Clicks

- `GET /api/recipients` - List all recipients
- `GET /api/clicks` - List all click events

### Reports

- `GET /api/report/csv` - Download CSV report of all clicks

## Project Structure

```
/project-root
  /src
    config.js          # Configuration and environment variables
    db.js              # Database operations and Supabase client
    emailSender.js     # Email sending logic with Nodemailer
    trackingServer.js  # Express server for tracking and API
    utils.js           # Utility functions
  /examples
    addRecipients.js   # Script to add recipients
    createCampaign.js  # Script to create campaigns
    sendCampaign.js    # Script to send campaigns
    viewReport.js      # Script to view analytics
  /public
    training.html      # Training page shown after click
  server.js            # Main server entry point
  .env.example         # Example environment configuration
```

## Security Considerations

### Data Protection
- All database tables use Row Level Security (RLS)
- Environment variables for sensitive credentials
- Rate limiting on tracking endpoint (10 requests per minute per IP)

### GDPR & Privacy
- Inform users that click tracking is for security training
- Store only necessary data (email, IP, timestamp, user agent)
- Provide data export and deletion capabilities
- Include privacy disclaimer on training page

### Email Best Practices
- Use reputable SMTP services (Gmail, SendGrid, AWS SES)
- Add SPF, DKIM, and DMARC records to your domain
- Include unsubscribe option if required by your organization
- Rate limit email sending to avoid spam filters

## Customization

### Email Templates

Edit the HTML in `examples/createCampaign.js` to customize your phishing simulation emails. Use placeholders for personalization:

```html
<p>Dear {{name}},</p>
<p>Your account {{email}} requires verification.</p>
<a href="{{tracking_url}}">Click here to verify</a>
```

### Training Page

Customize `public/training.html` to match your organization's branding and training requirements.

### Campaign Types

Create different campaigns for various phishing scenarios:
- Urgent account verification
- Package delivery notification
- Password reset request
- Invoice/payment notification
- IT helpdesk request

## Analytics & Reporting

### Campaign Statistics

Each campaign tracks:
- Total recipients
- Total clicks
- Unique clickers
- Click rate percentage

### CSV Export

Download comprehensive reports including:
- Campaign name
- Recipient details (name, email, department)
- IP address
- Click timestamp

Use this data to:
- Identify users who need training
- Track improvement over time
- Generate executive reports
- Measure security awareness program effectiveness

## Troubleshooting

### SMTP Connection Failed

- Verify SMTP credentials in `.env`
- Check that 2FA is enabled and App Password is generated (for Gmail)
- Ensure firewall allows outbound connections on port 587

### Database Connection Issues

- Verify Supabase credentials in `.env`
- Check that RLS policies are configured correctly
- Ensure Supabase project is active

### Tracking Links Not Working

- Verify `TRACKING_BASE_URL` in `.env` matches your server URL
- Ensure server is running and accessible
- Check that tracking tokens are generated correctly

## Legal & Ethical Considerations

**IMPORTANT**: This system is designed for legitimate security training purposes only.

- Obtain proper authorization before conducting phishing simulations
- Inform participants that training exercises may occur
- Follow your organization's security and HR policies
- Do not use for malicious purposes or unauthorized testing
- Comply with local laws regarding electronic communications

## License

This project is intended for educational and organizational security training purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for error messages
3. Verify environment configuration
4. Ensure database migrations completed successfully
