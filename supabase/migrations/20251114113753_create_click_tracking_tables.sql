/*
  # Email Click Tracking System for Security Training

  1. New Tables
    - `recipients`
      - `id` (uuid, primary key) - Unique identifier for each recipient
      - `email` (text, unique, not null) - Recipient email address
      - `name` (text) - Optional recipient name
      - `department` (text) - Optional department for reporting
      - `created_at` (timestamptz) - When recipient was added
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `campaigns`
      - `id` (uuid, primary key) - Unique identifier for each campaign
      - `name` (text, not null) - Campaign name
      - `subject` (text, not null) - Email subject line
      - `body` (text, not null) - Email body content
      - `status` (text, default 'draft') - Campaign status (draft/sent/completed)
      - `created_at` (timestamptz) - Campaign creation time
      - `sent_at` (timestamptz) - When campaign was sent
    
    - `click_events`
      - `id` (uuid, primary key) - Unique identifier for each click
      - `recipient_id` (uuid, foreign key) - Links to recipients table
      - `campaign_id` (uuid, foreign key) - Links to campaigns table
      - `tracking_token` (text, unique, not null) - Unique token for tracking link
      - `ip_address` (text) - IP address of clicker
      - `user_agent` (text) - Browser user agent string
      - `clicked_at` (timestamptz) - Timestamp of click
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access
    - Public read access to click_events for tracking endpoint (insert only)

  3. Indexes
    - Index on click_events.tracking_token for fast lookup
    - Index on click_events.recipient_id for reporting
    - Index on recipients.email for fast lookup
*/

-- Create recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  department text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Create click_events table
CREATE TABLE IF NOT EXISTS click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES recipients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  tracking_token text UNIQUE NOT NULL,
  ip_address text,
  user_agent text,
  clicked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_click_events_token ON click_events(tracking_token);
CREATE INDEX IF NOT EXISTS idx_click_events_recipient ON click_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_click_events_campaign ON click_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients(email);

-- Enable Row Level Security
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Policies for recipients table
CREATE POLICY "Authenticated users can view recipients"
  ON recipients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert recipients"
  ON recipients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update recipients"
  ON recipients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for campaigns table
CREATE POLICY "Authenticated users can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for click_events table
CREATE POLICY "Anyone can insert click events"
  ON click_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view click events"
  ON click_events FOR SELECT
  TO authenticated
  USING (true);