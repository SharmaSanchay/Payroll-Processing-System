const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salary_period: { type: String, required: true },
  basic_salary: { type: Number, required: true },
  allowances: { type: Number, required: true },
  deductions: { type: Number, required: true },
  reimbursement: { type: Number, required: true },
  net_amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['unprocessed', 'processed', 'failed'],
    default: 'unprocessed',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Payroll', payrollSchema);
