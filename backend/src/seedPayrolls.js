require('dotenv').config();
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Payroll = require('./models/Payroll');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRecentSalaryPeriods(months = 6) {
  const periods = [];

  const current = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(current.getFullYear(), current.getMonth() - i, 1);

    periods.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    );
  }

  return periods;
}

async function seedPayrolls() {
  await connectDB();

  const users = await User.find();

  if (!users.length) {
    console.log(
      'No users found in database. Seed users first or create at least one user.'
    );
    process.exit(0);
  }

  const salaryPeriods = getRecentSalaryPeriods(6);
  const currentPeriod = salaryPeriods[0];

  // Optional: clear existing payrolls
  await Payroll.deleteMany({});

  const payrolls = [];

  for (const user of users) {
    // Base salary stays consistent for an employee
    const basicSalary = randomInt(4000, 12000);

    for (const period of salaryPeriods) {
      const allowances = randomInt(500, 1500);
      const deductions = randomInt(100, 800);
      const reimbursement = randomInt(0, 600);

      const netAmount =
        basicSalary + allowances + reimbursement - deductions;

      let status = 'unprocessed';

      payrolls.push({
        employee_id: user._id,
        salary_period: period,
        basic_salary: basicSalary,
        allowances,
        deductions,
        reimbursement,
        net_amount: netAmount,
        status,
      });
    }
  }

  const created = await Payroll.insertMany(payrolls);

  console.log(
    `Created ${created.length} payroll records for ${users.length} employees.`
  );

  process.exit(0);
}

seedPayrolls().catch((err) => {
  console.error('Error seeding payrolls:', err);
  process.exit(1);
});