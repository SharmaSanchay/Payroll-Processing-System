require('dotenv').config();
const { Worker } = require('bullmq');
const { sendTemplateEmail } = require('../../src/services/emailService');
const { redisConnection } = require('../redis.config');

const emailWorker = new Worker(
  "EmailDeliveryQueue",
  async (job) => {
    const { to, template, variables = {} } = job.data;

    try {
      const info = await sendTemplateEmail({
        to,
        template,
        variables
      });

      console.log(`Email sent successfully (Job: ${job.id}, Message ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error processing email job ${job.id}:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000,
    },
  }
);

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has successfully finished.`);
});

emailWorker.on("error", (err) => {
  console.error(`Worker error:`, err);
});

const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Closing worker safely...`);
  await emailWorker.close();
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = emailWorker;

