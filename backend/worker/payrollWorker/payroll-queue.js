const { Queue } = require('bullmq');
const { redisConfig } = require('../redis.config');

const payrollQueue = new Queue('PayrollProcessingQueue', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400, count: 1000 },
  },
});

async function queuePayrollProcessing(payrollData, priority = 5) {
  const job = await payrollQueue.add('process:payroll', {
    payrollId: payrollData._id,
    employeeId: payrollData.employee_id,
    salaryPeriod: payrollData.salary_period,
    netAmount: payrollData.net_amount,
  }, { priority });

  console.log(`[Queue] Payroll ${payrollData._id} queued for processing (Job ID: ${job.id})`);
  return job;
}

async function queuePayrollEmailNotification(payrollData, employeeData) {
  const job = await payrollQueue.add('send:payroll-email', {
    payrollId: payrollData._id,
    employeeName: employeeData.name,
    employeeEmail: employeeData.email,
    salaryPeriod: payrollData.salary_period,
    netAmount: payrollData.net_amount,
  }, { priority: 3 });

  console.log(`[Queue] Email notification queued for payroll ${payrollData._id}`);
  return job;
}

module.exports = {
  payrollQueue,
  queuePayrollProcessing,
  queuePayrollEmailNotification,
};
