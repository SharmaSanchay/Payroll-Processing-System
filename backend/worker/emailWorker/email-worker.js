require('dotenv').config();
const { Worker } = require('bullmq');
const { z } = require('zod');
const { sendTemplateEmail } = require('../../src/services/emailService');
const { redisConfig } = require('../redis.config');


const emailWorker = new Worker(
  "EmailDeliveryQueue",
  async (job) => {
    if (job.name !== 'send:welcome') {
      const errorMsg = `Unsupported job name "${job.name}". Expected "send:welcome".`;
      console.error(`[Worker] Error on Job ${job.id}: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const { to, template, variables } = job.data;

    try {
      const info = await sendTemplateEmail({
        to,
        template,
        variables
      });

      console.log(`[Worker] Email sent successfully (Job: ${job.id}, Message ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[Worker] Error processing email job ${job.id}:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000,
    },
  }
);

emailWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
});

emailWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

emailWorker.on("error", (err) => {
  console.error(`[Worker] Uncaught worker error:`, err);
});

const handleShutdown = async (signal) => {
  console.log(`[Worker] Received ${signal}. Closing worker safely...`);
  try {
    await emailWorker.close();
    console.log(`[Worker] Closed successfully.`);
    process.exit(0);
  } catch (err) {
    console.error(`[Worker] Error during shutdown:`, err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = emailWorker;

