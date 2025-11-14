const { addRecipientsFromList } = require('../src/emailSender');

async function main() {
  const recipients = [
    { email: 'user1@example.com', name: 'John Doe', department: 'Engineering' },
    { email: 'user2@example.com', name: 'Jane Smith', department: 'Marketing' },
    { email: 'user3@example.com', name: 'Bob Johnson', department: 'Sales' },
    'user4@example.com',
    'user5@example.com'
  ];

  console.log('Adding recipients to database...');

  try {
    const results = await addRecipientsFromList(recipients);
    console.log('\n=== Results ===');
    console.log(`Total: ${results.total}`);
    console.log(`Added: ${results.added}`);
    console.log(`Skipped: ${results.skipped}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }

    console.log('\nRecipients added successfully!');
  } catch (error) {
    console.error('Error adding recipients:', error.message);
  }
}

main();
