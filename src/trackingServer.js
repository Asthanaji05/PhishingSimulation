const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('./config');
const db = require('./db');
const emailSender = require('./emailSender');
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

app.post('/api/campaigns', async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject and body are required' });
    }
    const campaign = await db.createCampaign(name, subject, body);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to create campaign' });
  }
});

app.put('/api/campaigns/:id', async (req, res) => {
  try {
    const updated = await db.updateCampaign(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to update campaign' });
  }
});

app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    await db.deleteCampaign(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to delete campaign' });
  }
});

app.post('/api/campaigns/:id/verify-smtp', async (req, res) => {
  try {
    const connected = await emailSender.verifyConnection();
    res.json({ connected });
  } catch (error) {
    console.error('Error verifying SMTP:', error);
    res.status(500).json({ error: error.message || 'Failed to verify SMTP connection' });
  }
});

app.post('/api/campaigns/:id/send', async (req, res) => {
  try {
    const { recipientEmails } = req.body;
    const result = await emailSender.sendCampaign(req.params.id, recipientEmails);
    res.json(result);
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to send campaign' });
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

app.get('/api/recipients/:id', async (req, res) => {
  try {
    const recipient = await db.getRecipientById(req.params.id);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    res.json(recipient);
  } catch (error) {
    console.error('Error fetching recipient:', error);
    res.status(500).json({ error: 'Failed to fetch recipient' });
  }
});

app.post('/api/recipients', async (req, res) => {
  try {
    const { email, name, department } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const recipient = await db.addRecipient(email, name, department);
    res.status(201).json(recipient);
  } catch (error) {
    console.error('Error creating recipient:', error);
    res.status(500).json({ error: error.message || 'Failed to create recipient' });
  }
});

app.put('/api/recipients/:id', async (req, res) => {
  try {
    const updated = await db.updateRecipient(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({ error: error.message || 'Failed to update recipient' });
  }
});

app.delete('/api/recipients/:id', async (req, res) => {
  try {
    await db.deleteRecipient(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({ error: error.message || 'Failed to delete recipient' });
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

app.get('/api/health/supabase', async (req, res) => {
  try {
    const result = await db.checkSupabaseHealth();
    if (result.status === 'ok') {
      return res.json({ status: 'ok' });
    }
    res.status(500).json(result);
  } catch (error) {
    console.error('Supabase health check failed:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

function startServer() {
  app.listen(config.server.port, () => {
    console.log(`Tracking server running on port ${config.server.port}`);
    console.log(`Tracking URL: ${config.server.trackingBaseUrl}/track/{token}`);
  });
}

module.exports = { app, startServer };
