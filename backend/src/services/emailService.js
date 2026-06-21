const nodemailer = require('nodemailer');
const { loadEmailTemplate, getEmailSubject } = require('./templateLoader');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendTemplateEmail(options) {
  const { to, template, variables = {} } = options;

  try {
    const htmlContent = loadEmailTemplate(template, 'html', variables);
    const textContent = loadEmailTemplate(template, 'txt', variables);
    const subject = getEmailSubject(template);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw error;
  }
}

async function sendWelcomeEmail(user, dashboardUrl, docsUrl) {
  const variables = {
    userName: user.name || user.email.split('@')[0],
    dashboardUrl: dashboardUrl || process.env.APP_URL || 'https://app.example.com/dashboard',
    docsUrl: docsUrl || process.env.APP_URL || 'https://docs.example.com',
  };

  return sendTemplateEmail({
    to: user.email,
    template: 'welcome-onboarding',
    variables,
  });
}

module.exports = { transporter, sendTemplateEmail, sendWelcomeEmail };