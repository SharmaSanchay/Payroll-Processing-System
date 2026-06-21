require('dotenv').config();
const { Worker } = require('bullmq');
const { payrollQueue } = require('./payroll-queue');
const { redisConnection } = require('../redis.config');
const { processPayroll } = require('../../src/services/payrollService');
const { sendTemplateEmail } = require('../../src/services/emailService');

const payrollWorker = new Worker(
  'PayrollProcessingQueue',
  async (job) => {
    const { payrollId } = job.data;

    try {
      if (job.name === 'process:payroll') {
        console.log(`Processing payroll job ${job.id}: Payroll ${payrollId}`);
        const result = await processPayroll(job.data);
        return result;
      } else if (job.name === 'send:payroll-email') {
        console.log(`Sending payroll email job ${job.id}: Payroll ${payrollId}`);
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

        console.log(`Payroll email sent successfully (Job: ${job.id}, Message ID: ${info.messageId})`);
        return {
          success: true,
          payrollId,
          messageId: info.messageId,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000,
    },
  }
);

payrollWorker.on('failed', (job, err) => {
  console.error(`Payroll job ${job?.id} failed with error: ${err.message}`);
});

payrollWorker.on('completed', (job) => {
  console.log(`Payroll job ${job.id} has successfully finished.`);
});

payrollWorker.on('error', (err) => {
  console.error(`Payroll worker error:`, err);
});

const handleShutdown = async (signal) => {
  console.log(`Received ${signal}. Closing payroll worker safely...`);
  await payrollWorker.close();
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

console.log('Payroll worker started and listening to PayrollProcessingQueue...');

module.exports = payrollWorker;
