/**
 * PayrollStatus Enum
 * Defines all possible states for a payroll record
 */
const PayrollStatus = {
  UNPROCESSED: 'UNPROCESSED',
  IN_PROGRESS: 'IN_PROGRESS',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
};

module.exports = PayrollStatus;
