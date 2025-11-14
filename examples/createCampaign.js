const { createCampaign } = require('../src/db');

async function main() {
  const campaignData = {
    name: 'Urgent Account Verification',
    subject: 'Action Required: Verify Your Account',
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #d32f2f; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Urgent: Account Verification Required</h1>
          </div>
          <div class="content">
            <p>Dear {{name}},</p>
            <p>We have detected unusual activity on your account ({{email}}). For security reasons, you must verify your account within 24 hours to avoid suspension.</p>
            <p>Click the button below to verify your account immediately:</p>
            <p style="text-align: center;">
              <a href="{{tracking_url}}" class="button">Verify Account Now</a>
            </p>
            <p><strong>Warning:</strong> Failure to verify your account within 24 hours will result in permanent suspension.</p>
            <p>If you did not request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This email was sent to {{email}}</p>
            <p>&copy; 2024 Security Team. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  console.log('Creating phishing simulation campaign...');

  try {
    const campaign = await createCampaign(
      campaignData.name,
      campaignData.subject,
      campaignData.body
    );

    console.log('\n=== Campaign Created ===');
    console.log(`ID: ${campaign.id}`);
    console.log(`Name: ${campaign.name}`);
    console.log(`Status: ${campaign.status}`);
    console.log(`Created: ${campaign.created_at}`);

    console.log('\nUse this campaign ID to send emails with sendCampaign.js');
  } catch (error) {
    console.error('Error creating campaign:', error.message);
  }
}

main();
