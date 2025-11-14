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
# Supabase Configuration
# Backend supports both naming conventions
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Or use REACT_APP_ prefix (for React frontend, backend will fallback to these)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server Configuration
TRACKING_BASE_URL=http://localhost:3000
SERVER_PORT=3000
```

**Note**: The backend will automatically use `REACT_APP_*` variables if the non-prefixed versions are not found, so you can use either naming convention.

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

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Start the Application

**Option A: Development Mode (Frontend + Backend)**
```bash
npm run dev
```
This starts both the Express server (port 3000) and React development server (port 3001).

**Option B: Production Mode**
```bash
# Build the React frontend
npm run build

# Start the server (serves both API and frontend)
npm start
```

The application will be available at `http://localhost:3000` (or your configured port).

### 3. Using the Web Interface

Once the application is running, you can:

- **Dashboard**: View overview statistics
- **Recipients**: Add, edit, and delete email recipients through the web interface
- **Campaigns**: Create, edit, delete, and send phishing simulation campaigns
- **Analytics**: View campaign performance, click statistics, and download CSV reports

### 4. Email Template Placeholders

When creating campaigns, use these placeholders in your email body:
- `{{name}}` - Recipient name or email
- `{{email}}` - Recipient email address
- `{{tracking_url}}` - Unique tracking link

### Legacy Scripts (Optional)

The original command-line scripts are still available but not required:

```bash
npm run add-recipients
npm run create-campaign
node examples/sendCampaign.js <campaign-id>
npm run view-report
```

## API Endpoints

The tracking server provides the following endpoints:

### Tracking

- `GET /track/:token` - Track click event and redirect to training page

### Campaigns

- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create a new campaign
- `PUT /api/campaigns/:id` - Update a campaign
- `DELETE /api/campaigns/:id` - Delete a campaign
- `GET /api/campaigns/:id/stats` - Get campaign statistics
- `GET /api/campaigns/:id/clicks` - Get all clicks for a campaign
- `POST /api/campaigns/:id/send` - Send campaign to recipients
- `POST /api/campaigns/:id/verify-smtp` - Verify SMTP connection

### Recipients

- `GET /api/recipients` - List all recipients
- `GET /api/recipients/:id` - Get a single recipient
- `POST /api/recipients` - Create a new recipient
- `PUT /api/recipients/:id` - Update a recipient
- `DELETE /api/recipients/:id` - Delete a recipient

### Clicks & Reports

- `GET /api/clicks` - List all click events
- `GET /api/report/csv` - Download CSV report of all clicks

### Health

- `GET /health` - Basic server heartbeat
- `GET /api/health/supabase` - Verifies Supabase connectivity

## Project Structure

```
/project-root
  /client              # React frontend application
    /src
      /components      # React components
      /pages           # Page components (Dashboard, Recipients, etc.)
      /services        # API service layer
    /public            # Static assets
    package.json       # Frontend dependencies
  /src
    config.js          # Configuration and environment variables
    db.js              # Database operations and Supabase client
    emailSender.js     # Email sending logic with Nodemailer
    trackingServer.js  # Express server for tracking and API
    utils.js           # Utility functions
  /examples
    addRecipients.js   # Script to add recipients (legacy)
    createCampaign.js  # Script to create campaigns (legacy)
    sendCampaign.js    # Script to send campaigns (legacy)
    viewReport.js      # Script to view analytics (legacy)
  /public
    training.html      # Training page shown after click
  /build               # React production build (generated)
  server.js            # Main server entry point
  package.json         # Backend dependencies
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
