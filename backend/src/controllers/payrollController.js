const payrollService = require('../services/payrollService');

exports.bulkApprovePayrolls = async (req, res) => {
  try {
    const { payrollIds } = req.body;
    const result = await payrollService.bulkApprovePayrolls(payrollIds);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in bulkApprovePayrolls:', error.message);
    return res.status(500).json({
      error: 'Server error',
      details: error.message,
    });
  }
};
