const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend('re_9qKcLH9m_AKf4fqbDiPpJmAVcHfWAvrUF');

async function testEmails() {
    try {
        console.log('Starting email tests...');

        // Test customer email
        console.log('\nTesting customer email to es64878@universum-ks.org:');
        const customerResult = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'es64878@universum-ks.org',
            subject: 'Test Customer Email',
            html: '<p>This is a test email for customer.</p>',
            tags: [{ name: 'type', value: 'customer_test' }]
        });
        console.log('Customer email response:', JSON.stringify(customerResult, null, 2));

        // Wait 2 seconds between sends
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test admin email
        console.log('\nTesting admin email to enisshbani71@gmail.com:');
        const adminResult = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'enisshbani71@gmail.com',
            subject: 'Test Admin Email',
            html: '<p>This is a test email for admin.</p>',
            tags: [{ name: 'type', value: 'admin_test' }]
        });
        console.log('Admin email response:', JSON.stringify(adminResult, null, 2));

    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            name: error.name,
            code: error.code,
            statusCode: error.statusCode,
            stack: error.stack
        });
    }
}

console.log('Environment check:');
console.log('ADMIN_EMAIL set:', !!process.env.ADMIN_EMAIL);
console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);

testEmails(); 