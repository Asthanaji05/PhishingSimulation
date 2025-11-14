const { sendCampaign, verifyConnection } = require('../src/emailSender');

async function main() {
  const campaignId = process.argv[2];

  if (!campaignId) {
    console.error('Usage: node sendCampaign.js <campaign-id> [email1,email2,...]');
    console.error('Example: node sendCampaign.js abc-123-def');
    console.error('Example with specific recipients: node sendCampaign.js abc-123-def user1@example.com,user2@example.com');
    process.exit(1);
  }

  const recipientEmails = process.argv[3] ? process.argv[3].split(',') : null;

  console.log('Verifying SMTP connection...');
  const connected = await verifyConnection();

  if (!connected) {
    console.error('Failed to connect to SMTP server. Check your email configuration in .env');
    process.exit(1);
  }

  console.log('SMTP connection successful!');
  console.log(`\nSending campaign: ${campaignId}`);

  if (recipientEmails) {
    console.log(`To specific recipients: ${recipientEmails.join(', ')}`);
  } else {
    console.log('To all recipients in database');
  }

  try {
    const results = await sendCampaign(campaignId, recipientEmails);

    console.log('\n=== Campaign Sent ===');
    console.log(`Total recipients: ${results.total}`);
    console.log(`Successfully sent: ${results.sent}`);
    console.log(`Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }

    console.log('\nCampaign sent successfully!');
    console.log('Check the tracking server for click analytics.');
  } catch (error) {
    console.error('Error sending campaign:', error.message);
    process.exit(1);
  }
}

main();
