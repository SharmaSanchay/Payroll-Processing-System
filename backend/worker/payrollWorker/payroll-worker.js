require('dotenv').config();
const { Worker } = require('bullmq');
const { redisConfig } = require('../redis.config');
const { connectDB } = require('../../src/config/db');
const { processPayroll } = require('../../src/services/payrollService');
const { sendTemplateEmail } = require('../../src/services/emailService');

(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Worker] Failed to connect to MongoDB. Exiting.', err.message);
    process.exit(1);
  }
})();

const payrollWorker = new Worker(
  'PayrollProcessingQueue',
  async (job) => {
    const { payrollId } = job.data;

    try {
      if (job.name === 'process:payroll') {
        console.log(`[Worker] Processing payroll job ${job.id}: Payroll ${payrollId}`);
        const result = await processPayroll(job.data);
        return result;
      } else if (job.name === 'send:payroll-email') {
        console.log(`[Worker] Sending payroll email job ${job.id}: Payroll ${payrollId}`);
        const { employeeName, employeeEmail, salaryPeriod, netAmount } = job.data;

        const variables = {
          employeeName,
          salaryPeriod,
          netAmount: `$${netAmount.toFixed(2)}`,
        };

        const info = await sendTemplateEmail({
          to: employeeEmail,
          template: 'payroll-processed',
          variables,
        });

        console.log(`[Worker] Payroll email sent successfully (Job: ${job.id}, Message ID: ${info.messageId})`);
        return {
          success: true,
          payrollId,
          messageId: info.messageId,
          timestamp: new Date().toISOString(),
        };
      } else {
        const errorMsg = `Unsupported job name "${job.name}". Expected "process:payroll" or "send:payroll-email".`;
        console.error(`[Worker] Error on Job ${job.id}: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`[Worker] Error processing job ${job.id}:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

payrollWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
});

payrollWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

payrollWorker.on('error', (err) => {
  console.error(`[Worker] Uncaught worker error:`, err);
});

const handleShutdown = async (signal) => {
  console.log(`[Worker] Received ${signal}. Closing payroll worker safely...`);
  try {
    await payrollWorker.close();
    console.log(`[Worker] Closed successfully.`);
    process.exit(0);
  } catch (err) {
    console.error(`[Worker] Error during shutdown:`, err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

console.log('[Worker] Payroll worker started and listening to PayrollProcessingQueue...');

module.exports = payrollWorker;
