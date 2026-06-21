const { Queue } = require('bullmq');
const { redisConfig } = require('../redis.config');

const emailQueue = new Queue('EmailDeliveryQueue', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 3600, count: 100 }, 
    removeOnFail: { age: 86400, count: 1000 },  
  }
});

async function queueWelcomeEmail(user, dashboardUrl, docsUrl) {
  if (!user) {
    throw new Error('Cannot queue welcome email: User object is required.');
  }
  if (!user.email) {
    throw new Error('Cannot queue welcome email: A valid recipient email address is required.');
  }

  const userId = user._id || user.id;

  const job = await emailQueue.add(
    'send:welcome',
    {
      userId,
      to: user.email.trim().toLowerCase(),
      template: 'welcome-onboarding',
      variables: {
        userName:user.name,
        dashboardUrl: dashboardUrl || process.env.APP_URL || 'https://app.example.com/dashboard',
        docsUrl: docsUrl || process.env.APP_URL || 'https://docs.example.com'
      }
    },
    {
      priority: 1 
    }
  );

  console.log(`[Queue] Successfully enqueued welcome email (Job ID: ${job.id}) for user: ${user.email}`);
  return job;
}

module.exports = { emailQueue, queueWelcomeEmail };
