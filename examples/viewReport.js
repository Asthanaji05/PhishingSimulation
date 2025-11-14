const { getAllClickEvents, getAllCampaigns, getCampaignStats } = require('../src/db');

async function main() {
  console.log('=== Email Click Tracking Report ===\n');

  try {
    const campaigns = await getAllCampaigns();

    if (campaigns.length === 0) {
      console.log('No campaigns found.');
      return;
    }

    console.log(`Total campaigns: ${campaigns.length}\n`);

    for (const campaign of campaigns) {
      console.log(`Campaign: ${campaign.name}`);
      console.log(`  ID: ${campaign.id}`);
      console.log(`  Subject: ${campaign.subject}`);
      console.log(`  Status: ${campaign.status}`);
      console.log(`  Created: ${campaign.created_at}`);

      if (campaign.sent_at) {
        console.log(`  Sent: ${campaign.sent_at}`);
      }

      const stats = await getCampaignStats(campaign.id);
      console.log(`  Total Recipients: ${stats.totalRecipients}`);
      console.log(`  Unique Clickers: ${stats.uniqueClickers}`);
      console.log(`  Total Clicks: ${stats.totalClicks}`);
      console.log(`  Click Rate: ${stats.clickRate}%`);
      console.log('');
    }

    const clicks = await getAllClickEvents();

    if (clicks.length > 0) {
      console.log('\n=== Recent Clicks ===\n');

      clicks.slice(0, 10).forEach(click => {
        const recipientEmail = click.recipients?.email || 'N/A';
        const recipientName = click.recipients?.name || 'N/A';
        const campaignName = click.campaigns?.name || 'N/A';

        console.log(`Campaign: ${campaignName}`);
        console.log(`  Recipient: ${recipientName} (${recipientEmail})`);
        console.log(`  IP: ${click.ip_address || 'N/A'}`);
        console.log(`  Clicked: ${click.clicked_at || 'N/A'}`);
        console.log('');
      });

      if (clicks.length > 10) {
        console.log(`... and ${clicks.length - 10} more clicks`);
      }
    }

    console.log('\nFor full CSV report, visit: http://localhost:3000/api/report/csv');
  } catch (error) {
    console.error('Error generating report:', error.message);
  }
}

main();
