const express = require('express');
const payrollController = require('../controllers/payrollController');

const router = express.Router();

router.post('/bulk-approve', payrollController.bulkApprovePayrolls);

module.exports = router;
