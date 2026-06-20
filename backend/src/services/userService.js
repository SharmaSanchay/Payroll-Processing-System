const User = require("../models/User");

async function createUser(payload) {
  const exists = await User.findOne({ email: payload.email });
  if (exists) {
    const err = new Error("Email already exists");
    err.status = 409;
    throw err;
  }
  return User.create(payload);
}

async function getUserById(id) {
  return User.findById(id).lean();
}

async function updateUser(id, updates) {
  const exists = await User.findOne({ email: updates.email, _id: { $ne: id } });
  if (exists) {
    const err = new Error("Email already exists");
    err.status = 409;
    throw err;
  }
  return User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();
}

async function listUsers({ page = 1, pageSize = 10, status } = {}) {
  const limit = pageSize;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
  ]);
  return { total, users, page, pages: Math.ceil(total / limit) || 1, limit };
}

async function toggleStatus(id) {
  const user = await User.findById(id);
  if (!user) return null;
  user.status = user.status === "active" ? "inactive" : "active";
  await user.save();
  return user;
}

module.exports = {
  createUser,
  getUserById,
  updateUser,
  listUsers,
  toggleStatus,
};
