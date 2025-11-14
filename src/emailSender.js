const nodemailer = require('nodemailer');
const config = require('./config');
const db = require('./db');
const { generateTrackingToken, buildTrackingUrl, replacePlaceholders } = require('./utils');

const transporter = nodemailer.createTransport(config.smtp);

async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error.message);
    return false;
  }
}

async function sendEmail(to, subject, htmlContent) {
  const mailOptions = {
    from: config.smtp.auth.user,
    to,
    subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function sendCampaign(campaignId, recipientEmails = null) {
  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  let recipients;
  if (recipientEmails && recipientEmails.length > 0) {
    recipients = await Promise.all(
      recipientEmails.map(email => db.getRecipientByEmail(email))
    );
    recipients = recipients.filter(r => r !== null);
  } else {
    recipients = await db.getAllRecipients();
  }

  if (recipients.length === 0) {
    throw new Error('No recipients found');
  }

  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const recipient of recipients) {
    const trackingToken = generateTrackingToken();
    const trackingUrl = buildTrackingUrl(config.server.trackingBaseUrl, trackingToken);

    const emailContent = replacePlaceholders(campaign.body, {
      name: recipient.name || recipient.email,
      email: recipient.email,
      tracking_url: trackingUrl
    });

    const result = await sendEmail(recipient.email, campaign.subject, emailContent);

    if (result.success) {
      results.sent++;

      try {
        await db.supabase.from('click_events').insert({
          recipient_id: recipient.id,
          campaign_id: campaign.id,
          tracking_token: trackingToken
        });
      } catch (dbError) {
        console.error(`Failed to create tracking record for ${recipient.email}:`, dbError.message);
      }
    } else {
      results.failed++;
      results.errors.push({
        email: recipient.email,
        error: result.error
      });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await db.updateCampaignStatus(campaignId, 'sent', new Date().toISOString());

  return results;
}

async function addRecipientsFromList(emailList) {
  const results = {
    total: emailList.length,
    added: 0,
    skipped: 0,
    errors: []
  };

  for (const item of emailList) {
    const email = typeof item === 'string' ? item : item.email;
    const name = typeof item === 'object' ? item.name : null;
    const department = typeof item === 'object' ? item.department : null;

    try {
      const existing = await db.getRecipientByEmail(email);
      if (existing) {
        results.skipped++;
      } else {
        await db.addRecipient(email, name, department);
        results.added++;
      }
    } catch (error) {
      results.errors.push({
        email,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  verifyConnection,
  sendEmail,
  sendCampaign,
  addRecipientsFromList
};
