// A mock email service for local development.
// In the future, you can replace this with nodemailer or your corporate SMTP script.

async function sendEmail(to, subject, htmlContent) {
  console.log('\n==================================================');
  console.log('📧 MOCK EMAIL SENT');
  console.log('==================================================');
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log('BODY:');
  // Strip simple HTML tags for console readability
  console.log(htmlContent.replace(/<br\s*\/?>/ig, '\n').replace(/<[^>]*>?/gm, ''));
  console.log('==================================================\n');
  
  return true;
}

module.exports = { sendEmail };
