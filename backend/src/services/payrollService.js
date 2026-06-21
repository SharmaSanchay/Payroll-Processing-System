const Payroll = require('../../src/models/Payroll');
const User = require('../../src/models/User');
const { queuePayrollProcessing, queuePayrollEmailNotification } = require('../../worker/payrollWorker/payroll-queue');
const PayrollStatus = require('../../src/constants/PayrollStatus');


async function bulkApprovePayrolls(payrollIds) {
  if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
    throw new Error('Nothing to process');
  }

  const payrolls = await Payroll.find({ _id: { $in: payrollIds } }).lean();
  console.log(`Fetched ${payrolls.length} payrolls from database`);

  if (payrolls.length === 0) {
    return {
      message: 'No payrolls found with given IDs',
      queuedCount: 0,
      skippedCount: 0,
    };
  }

  const unprocessedPayrolls = payrolls.filter(p => p.status === PayrollStatus.UNPROCESSED);
  const skippedPayrolls = payrolls.filter(p => p.status !== PayrollStatus.UNPROCESSED);

  if (unprocessedPayrolls.length === 0) {
    return {
      message: 'No unprocessed payrolls found to approve',
      queuedCount: 0,
      skippedCount: skippedPayrolls.length,
    };
  }
  const unprocessedIds = unprocessedPayrolls.map(p => p._id);

  try {
    await Payroll.updateMany(
      { _id: { $in: unprocessedIds } },
      { $set: { status: PayrollStatus.IN_PROGRESS, updated_at: new Date() } }
    );

    const queueResults = await Promise.allSettled(
      unprocessedPayrolls.map(payroll => queuePayrollProcessing(payroll, 5))
    );

    const successfulQueues = queueResults.filter(result => result.status === 'fulfilled').length;
    const failedPayrollIds = queueResults
      .map((result, index) => ({ result, payrollId: unprocessedIds[index] }))
      .filter(entry => entry.result.status === 'rejected')
      .map(entry => entry.payrollId);

    if (failedPayrollIds.length > 0) {
      console.error(`Failed to queue ${failedPayrollIds.length} payroll(s), reverting their status to UNPROCESSED.`);
      await Payroll.updateMany(
        { _id: { $in: failedPayrollIds } },
        { $set: { status: PayrollStatus.UNPROCESSED, updated_at: new Date() } }
      );
    }

    console.log(`Bulk approval completed. Queued ${successfulQueues} jobs, ${failedPayrollIds.length} failed to queue.`);

    return {
      message: 'Payroll processing initiated successfully',
      queuedCount: successfulQueues,
      skippedCount: skippedPayrolls.length,
    };
  } catch (error) {
    await Payroll.updateMany(
      { _id: { $in: unprocessedIds } },
      { $set: { status: PayrollStatus.UNPROCESSED, updated_at: new Date() } }
    ).catch(rollbackErr => console.error('Rollback failed:', rollbackErr.message));

    console.error('Bulk approval failed:', error.message);
    throw new Error(`Bulk approval failed: ${error.message}`);
  }
}

async function processPayroll(payrollData) {
  const { payrollId, employeeId, salaryPeriod, netAmount } = payrollData;

  try {
    console.log(`Processing payroll ${payrollId} for employee ${employeeId}`);
    const employee = await User.findById(employeeId).lean();
    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    const updatedPayroll = await Payroll.findByIdAndUpdate(
      payrollId,
      { $set: { status: PayrollStatus.PROCESSED, updated_at: new Date() } },
      { new: true }
    );

    if (!updatedPayroll) {
      throw new Error(`Payroll ${payrollId} not found`);
    }

    console.log(`Payroll ${payrollId} processed successfully`);

    await queuePayrollEmailNotification(updatedPayroll, employee);

    return { success: true, payrollId, status: PayrollStatus.PROCESSED };
  } catch (error) {
    console.error(`Error processing payroll ${payrollId}:`, error.message);

    await Payroll.findByIdAndUpdate(
      payrollId,
      { $set: { status: PayrollStatus.FAILED, updated_at: new Date() } },
      { new: true }
    ).catch(err => console.error('Failed to update payroll status:', err));

    throw error;
  }
}

module.exports = {
  bulkApprovePayrolls,
  processPayroll,
};
