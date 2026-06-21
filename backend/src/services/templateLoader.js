const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../../public/templates');

function loadEmailTemplate(templateName, format = 'html', variables = {}) {
  try {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.${format}`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}.${format}`);
    }

    let content = fs.readFileSync(templatePath, 'utf-8');

    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, variables[key] || '');
    });

    return content;
  } catch (error) {
    console.error(`Error loading template ${templateName}.${format}:`, error.message);
    throw error;
  }
}

function getEmailSubject(templateName) {
  const subjects = {
    'welcome-onboarding': 'Welcome to Payroll Processing System!',
    'payroll-processed': 'Payroll Processed Successfully',
    'password-reset': 'Password Reset Request',
    'email-verification': 'Verify Your Email',
  };

  return subjects[templateName] || 'Notification from Payroll Processing System';
}
module.exports = { loadEmailTemplate, getEmailSubject };
