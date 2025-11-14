# System Documentation

## Overview

The Email Click Tracking System is a Node.js-based application designed for organizational phishing simulation and security awareness training. It enables security teams to send simulated phishing emails, track user interactions, and identify employees who may need additional security training.

## System Architecture

### High-Level Architecture

```text
┌────────────────────────────┐
│   React Admin Frontend     │
│   (client/, port 3001 dev) │
└──────────────┬─────────────┘
               │ REST / API calls
               ▼
┌─────────────────────────────────┐
│   Express Tracking Server       │
│   (Port 3000)                   │
│   - /track/:token               │
│   - /api/* + health endpoints   │
└────────┬───────────────┬────────┘
         │               │
         │ Logs clicks   │ Sends campaigns
         ▼               ▼
┌────────────────┐   ┌─────────────────────┐
│ Supabase DB    │   │ SMTP Server         │
│ - recipients   │   │ (Gmail/SendGrid/etc)│
│ - campaigns    │   └─────────────────────┘
│ - click_events │
└────────────────┘
         ▲
         │ Legacy automation scripts (optional)
         │ - addRecipients.js, sendCampaign.js, etc.
         ▼
┌────────────────────────────┐
│ Node CLI scripts (examples)│
└────────────────────────────┘
```

## Core Components

### 1. Tracking Server (`src/trackingServer.js`)

**Purpose**: Main Express.js server that handles HTTP requests for tracking clicks and providing API endpoints.

**Key Responsibilities**:

- Serves static files (training page)
- Handles click tracking via `/track/:token` endpoint
- Provides REST API for campaigns, recipients, and analytics
- Implements rate limiting (10 requests/minute per IP)
- Generates CSV reports

**Key Features**:

- Rate limiting using `rate-limiter-flexible`
- IP address extraction from various proxy headers
- User agent capture
- Automatic redirect to training page after click

### 2. Database Layer (`src/db.js`)

**Purpose**: Abstraction layer for all database operations using Supabase client.

- **Recipient Management**: `addRecipient()`, `getRecipientByEmail()`, `getRecipientById()`, `getAllRecipients()`, `updateRecipient()`, `deleteRecipient()`
- **Campaign Management**: `createCampaign()`, `getCampaign()`, `getAllCampaigns()`, `updateCampaign()`, `deleteCampaign()`, `updateCampaignStatus()`
- **Click Tracking**: `logClickEvent()`, `getClickEventByToken()`, `getClickEventsByCampaign()`, `getAllClickEvents()`
- **Analytics & Health**: `getCampaignStats()` for reporting, `checkSupabaseHealth()` for runtime diagnostics

**Database Clients**:

- `supabase`: Service role client for admin operations
- `supabaseAnon`: Anonymous client for public tracking endpoint

### 3. Email Sender (`src/emailSender.js`)

**Purpose**: Handles email delivery using Nodemailer.

**Key Functions**:

- `verifyConnection()`: Tests SMTP connectivity
- `sendEmail()`: Sends individual emails
- `sendCampaign()`: Bulk email sending with tracking token generation
- `addRecipientsFromList()`: Batch recipient addition

**Email Flow**:

1. Retrieves campaign and recipient data
2. Generates unique tracking token for each recipient
3. Replaces placeholders in email template (`{{name}}`, `{{email}}`, `{{tracking_url}}`)
4. Sends email via SMTP
5. Creates tracking record in database
6. Updates campaign status to 'sent'

### 4. Configuration (`src/config.js`)

**Purpose**: Centralized configuration management from environment variables.

**Configuration Sections**:

- **Supabase**: URL, anonymous key, service role key
- **SMTP**: Host, port, authentication credentials
- **Server**: Port, tracking base URL

The configuration loader first looks for `SUPABASE_*` variables and automatically falls back to `REACT_APP_SUPABASE_*`, so a single `.env` file can power both backend and frontend.

### 5. Utilities (`src/utils.js`)

**Purpose**: Shared utility functions used across the system.

**Functions**:

- `generateTrackingToken()`: Creates cryptographically secure 64-character hex token
- `getClientIp()`: Extracts client IP from request (handles proxies)
- `getUserAgent()`: Extracts browser user agent string
- `buildTrackingUrl()`: Constructs tracking URL from base URL and token
- `replacePlaceholders()`: Template engine for email personalization

### 6. React Frontend (`client/`)

**Purpose**: Provides the administrative UI for campaign orchestration, built with React 18, React Router, and Reactstrap.

**Key Screens**:

- **Dashboard** – global metrics pulled from `/api/campaigns`, `/api/recipients`, `/api/clicks`
- **Recipients** – CRUD interface mapped to `/api/recipients/*`
- **Campaigns** – manage templates, trigger SMTP sends, and view delivery errors
- **Analytics** – campaign-level drill-down, CSV export, and Supabase-backed statistics

The frontend communicates with the Express API via `client/src/services/api.js`, and is served statically from `/build` in production.

## Data Flow

### Campaign Sending Flow (UI-driven)

```text
1. Admin opens the Campaigns page in the React frontend
   ↓
2. UI calls /api/campaigns to list drafts and POST /api/campaigns for new templates
   ↓
3. When "Send" is triggered, frontend verifies SMTP (/api/campaigns/:id/verify-smtp)
   ↓
4. Backend generates tracking tokens, sends email via Nodemailer, and stores the pending click record
   ↓
5. Campaign status is updated to "sent" once dispatch completes
```

### Click Tracking Flow

```text
1. Recipient clicks tracking link in email
   ↓
2. Request hits /track/:token endpoint
   ↓
3. Rate limiter checks IP address
   ↓
4. Server looks up click_events record by token
   ↓
5. If not already clicked:
   a. Extract IP address and user agent
   b. Update click_events record with click data
   ↓
6. Serve training.html page
```

## API Surface

All functionality is exposed via REST endpoints under `/api`:

- **Tracking & Health**
  - `GET /track/:token` – log clicks and serve the training page
  - `GET /health` – process heartbeat
  - `GET /api/health/supabase` – Supabase connectivity check
- **Campaigns**
  - `GET /api/campaigns`, `GET /api/campaigns/:id`
  - `POST /api/campaigns`, `PUT /api/campaigns/:id`, `DELETE /api/campaigns/:id`
  - `GET /api/campaigns/:id/stats`, `GET /api/campaigns/:id/clicks`
  - `POST /api/campaigns/:id/verify-smtp`, `POST /api/campaigns/:id/send`
- **Recipients**
  - `GET /api/recipients`, `GET /api/recipients/:id`
  - `POST /api/recipients`, `PUT /api/recipients/:id`, `DELETE /api/recipients/:id`
- **Analytics**
  - `GET /api/clicks`
  - `GET /api/report/csv`

Legacy CLI scripts in `/examples` call the same Supabase layer and remain useful for automation, but the UI now covers all CRUD actions.

## Database Schema

### Table: `recipients`

Stores email recipients who can receive phishing simulation emails.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | text | Unique email address |
| `name` | text | Optional recipient name |
| `department` | text | Optional department for reporting |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Indexes**: `email` (unique)

### Table: `campaigns`

Stores phishing simulation campaign templates and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Campaign name |
| `subject` | text | Email subject line |
| `body` | text | HTML email body with placeholders |
| `status` | text | Campaign status: 'draft', 'sent', 'completed' |
| `created_at` | timestamptz | Campaign creation timestamp |
| `sent_at` | timestamptz | When campaign was sent |

### Table: `click_events`

Logs all click events with tracking information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `recipient_id` | uuid | Foreign key to recipients |
| `campaign_id` | uuid | Foreign key to campaigns |
| `tracking_token` | text | Unique token for tracking link |
| `ip_address` | text | IP address of clicker |
| `user_agent` | text | Browser user agent string |
| `clicked_at` | timestamptz | Timestamp when link was clicked |
| `created_at` | timestamptz | Record creation timestamp |

**Indexes**:

- `tracking_token` (unique) - for fast lookup
- `recipient_id` - for reporting
- `campaign_id` - for campaign analytics

**Foreign Keys**:

- `recipient_id` → `recipients(id)` ON DELETE CASCADE
- `campaign_id` → `campaigns(id)` ON DELETE CASCADE

## API Endpoints

### Tracking Endpoint

- **GET `/track/:token`**
  - Purpose: Track click event and redirect to training page
  - Rate Limit: 10 requests/minute per IP
  - Response: Serves `training.html` static file
  - Side Effect: Logs click event with IP and user agent

### Campaign Endpoints

- **GET `/api/campaigns`**
  - Returns: Array of all campaigns
  - Response: JSON array of campaign objects

- **GET `/api/campaigns/:id`**
  - Returns: Single campaign details
  - Response: JSON campaign object or 404

- **GET `/api/campaigns/:id/stats`**
  - Returns: Campaign statistics
  - Response: `{ totalRecipients, totalClicks, uniqueClickers, clickRate }`

- **GET `/api/campaigns/:id/clicks`**
  - Returns: All click events for a campaign
  - Response: JSON array with recipient details

### Recipient & Click Endpoints

- **GET `/api/recipients`**
  - Returns: All recipients
  - Response: JSON array of recipient objects

- **GET `/api/clicks`**
  - Returns: All click events across all campaigns
  - Response: JSON array with recipient and campaign details

### Report Endpoints

- **GET `/api/report/csv`**
  - Returns: CSV file download
  - Headers: `Content-Type: text/csv`, `Content-Disposition: attachment`
  - Columns: Campaign, Recipient Name, Recipient Email, Department, IP Address, Clicked At

### Health Check

- **GET `/health`**
  - Returns: Server status
  - Response: `{ status: 'ok', timestamp: ISO string }`

## Security Features

### Row Level Security (RLS)

All database tables have RLS enabled with the following policies:

- **recipients**: Authenticated users can SELECT, INSERT, UPDATE
- **campaigns**: Authenticated users can SELECT, INSERT, UPDATE
- **click_events**:
  - Anonymous and authenticated users can INSERT (for tracking)
  - Authenticated users can SELECT (for reporting)

### Rate Limiting

- **Implementation**: `rate-limiter-flexible` with in-memory storage
- **Limit**: 10 requests per minute per IP address
- **Scope**: Applied to `/track/:token` endpoint only
- **Response**: HTTP 429 (Too Many Requests) when exceeded

### Data Protection

- Environment variables for sensitive credentials
- Service role key used only for admin operations
- Anonymous key used for public tracking endpoint
- No sensitive data in URL parameters (tokens only)

## Technology Stack

### Runtime & Framework

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework

### Database

- **Supabase**: PostgreSQL database with REST API
- **PostgreSQL**: Relational database

### Email

- **Nodemailer**: SMTP email sending library

### Security & Utilities

- **rate-limiter-flexible**: Rate limiting middleware
- **uuid**: UUID generation (via crypto module)
- **crypto**: Built-in Node.js module for secure token generation
- **dotenv**: Environment variable management

## File Structure

```text
PhishingSimulation/
├── src/
│   ├── config.js           # Configuration management
│   ├── db.js               # Database operations
│   ├── emailSender.js      # Email sending logic
│   ├── trackingServer.js   # Express server & API
│   └── utils.js            # Utility functions
├── examples/
│   ├── addRecipients.js    # Add recipients script
│   ├── createCampaign.js   # Create campaign script
│   ├── sendCampaign.js     # Send campaign script
│   └── viewReport.js       # View analytics script
├── public/
│   └── training.html       # Training page after click
├── supabase/
│   └── migrations/
│       └── 20251114113753_create_click_tracking_tables.sql
├── index.js                # CLI help menu
├── server.js               # Server entry point
├── package.json            # Dependencies & scripts
└── README.md               # User documentation
```

## Deployment Architecture

### Development

- Single Node.js process running Express server
- Direct connection to Supabase database
- SMTP server (Gmail/SendGrid) for email delivery

### Production Considerations

1. **Server Deployment**
   - Use process manager (PM2, systemd)
   - Configure reverse proxy (Nginx) for HTTPS
   - Set up environment variables securely
   - Configure firewall rules

2. **Database**
   - Supabase handles scaling and backups
   - Ensure RLS policies are properly configured
   - Monitor connection pool limits

3. **Email Delivery**
   - Use dedicated SMTP service (SendGrid, AWS SES)
   - Configure SPF, DKIM, DMARC records
   - Implement email sending queue for large campaigns
   - Monitor bounce rates and spam complaints

4. **Monitoring**
   - Log aggregation (Winston, Pino)
   - Error tracking (Sentry)
   - Performance monitoring
   - Database query monitoring

5. **Security**
   - HTTPS/TLS for all connections
   - Regular security updates
   - Access control for admin scripts
   - Audit logging for sensitive operations

## Email Template System

### Placeholders

Email templates support the following placeholders:

- `{{name}}`: Recipient name or email if name not available
- `{{email}}`: Recipient email address
- `{{tracking_url}}`: Unique tracking URL for this recipient

### Template Example

```html
<p>Dear {{name}},</p>
<p>Your account {{email}} requires verification.</p>
<a href="{{tracking_url}}">Click here to verify</a>
```

The `replacePlaceholders()` function performs regex-based replacement of all placeholders in the template.

## Analytics & Reporting

### Campaign Statistics

The `getCampaignStats()` function calculates:

- **totalRecipients**: Total number of recipients in the system
- **totalClicks**: Total number of clicks (including duplicates)
- **uniqueClickers**: Number of unique recipients who clicked
- **clickRate**: Percentage of unique clickers (uniqueClickers / totalRecipients * 100)

### CSV Export

The CSV report includes:

- Campaign name
- Recipient details (name, email, department)
- IP address
- Click timestamp

This data can be used for:

- Identifying users needing training
- Tracking improvement over time
- Executive reporting
- Measuring program effectiveness

## Error Handling

### Database Errors

- All database operations use try-catch blocks
- Errors are logged to console
- API endpoints return appropriate HTTP status codes

### Email Errors

- Failed emails are logged but don't stop the campaign
- Results object tracks sent/failed counts
- Individual errors are collected in results.errors array

### Tracking Errors

- Invalid tokens return 404
- Rate limit exceeded returns 429
- Server errors return 500 with generic message

## Future Enhancements

Potential improvements for the system:

1. **Authentication**: Add admin authentication for API endpoints
2. **Email Queue**: Implement job queue for large campaigns
3. **Dashboard**: Web-based admin dashboard
4. **Advanced Analytics**: Charts, trends, department comparisons
5. **Email Templates**: Template library and editor
6. **Scheduled Campaigns**: Time-based campaign sending
7. **A/B Testing**: Multiple email variants per campaign
8. **Integration**: SIEM integration, Slack notifications
9. **Compliance**: GDPR data export/deletion tools
10. **Testing**: Automated test suite
