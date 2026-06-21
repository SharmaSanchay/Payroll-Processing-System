const { Queue } = require('bullmq');
const { redisConnection } = require('../redis.config');

const emailQueue = new Queue('EmailDeliveryQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 3600, count: 100 }, 
    removeOnFail: { age: 86400, count: 1000 },  
  }
});

async function queueWelcomeEmail(user, dashboardUrl, docsUrl) {
  await emailQueue.add('send:welcome', {
    userId: user._id || user.id,
    to: user.email,
    template: 'welcome-onboarding',
    variables: {
      userName: user.name || user.email.split('@')[0],
      dashboardUrl: dashboardUrl || process.env.APP_URL || 'https://app.example.com/dashboard',
      docsUrl: docsUrl || process.env.APP_URL || 'https://docs.example.com'
    }
  }, {
    priority: 1 
  });
}

async function queueEmail(to, template, variables = {}, priority = 5) {
  await emailQueue.add('send:template', {
    to,
    template,
    variables
  }, {
    priority
  });
}

module.exports = { emailQueue, queueWelcomeEmail, queueEmail };
