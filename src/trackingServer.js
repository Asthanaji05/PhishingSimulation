const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('./config');
const db = require('./db');
const { getClientIp, getUserAgent } = require('./utils');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60
});

app.get('/track/:token', async (req, res) => {
  const { token } = req.params;
  const ipAddress = getClientIp(req);

  try {
    await rateLimiter.consume(ipAddress);
  } catch (rateLimiterError) {
    console.warn(`Rate limit exceeded for IP: ${ipAddress}`);
    return res.status(429).send('Too many requests. Please try again later.');
  }

  if (!token || token.length < 10) {
    return res.status(400).send('Invalid tracking token');
  }

  try {
    const existingEvent = await db.getClickEventByToken(token);

    if (!existingEvent) {
      return res.status(404).send('Tracking link not found or expired');
    }

    if (!existingEvent.clicked_at || existingEvent.ip_address === null) {
      const userAgent = getUserAgent(req);
      await db.logClickEvent(
        existingEvent.recipient_id,
        existingEvent.campaign_id,
        token,
        ipAddress,
        userAgent
      );
    }

    res.sendFile(path.join(__dirname, '../public/training.html'));
  } catch (error) {
    console.error('Error processing click event:', error);
    res.status(500).send('An error occurred');
  }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await db.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await db.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

app.get('/api/campaigns/:id/stats', async (req, res) => {
  try {
    const stats = await db.getCampaignStats(req.params.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

app.get('/api/campaigns/:id/clicks', async (req, res) => {
  try {
    const clicks = await db.getClickEventsByCampaign(req.params.id);
    res.json(clicks);
  } catch (error) {
    console.error('Error fetching campaign clicks:', error);
    res.status(500).json({ error: 'Failed to fetch campaign clicks' });
  }
});

app.get('/api/recipients', async (req, res) => {
  try {
    const recipients = await db.getAllRecipients();
    res.json(recipients);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

app.get('/api/clicks', async (req, res) => {
  try {
    const clicks = await db.getAllClickEvents();
    res.json(clicks);
  } catch (error) {
    console.error('Error fetching clicks:', error);
    res.status(500).json({ error: 'Failed to fetch clicks' });
  }
});

app.get('/api/report/csv', async (req, res) => {
  try {
    const clicks = await db.getAllClickEvents();

    let csv = 'Campaign,Recipient Name,Recipient Email,Department,IP Address,Clicked At\n';

    clicks.forEach(click => {
      const campaignName = click.campaigns?.name || 'N/A';
      const recipientName = click.recipients?.name || 'N/A';
      const recipientEmail = click.recipients?.email || 'N/A';
      const department = click.recipients?.department || 'N/A';
      const ipAddress = click.ip_address || 'N/A';
      const clickedAt = click.clicked_at || 'N/A';

      csv += `"${campaignName}","${recipientName}","${recipientEmail}","${department}","${ipAddress}","${clickedAt}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=click_report.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function startServer() {
  app.listen(config.server.port, () => {
    console.log(`Tracking server running on port ${config.server.port}`);
    console.log(`Tracking URL: ${config.server.trackingBaseUrl}/track/{token}`);
  });
}

module.exports = { app, startServer };
