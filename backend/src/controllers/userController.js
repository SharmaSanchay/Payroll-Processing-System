const userService = require('../services/userService');

exports.createUser = async (req, res) => {
  try {
    const payload = req.validatedBody || req.body;
    const user = await userService.createUser(payload);
    return res.status(201).json({ data: user });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate field value', details: err.keyValue });
    }
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const { id } = req.validatedParams || req.params;
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ data: user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { id } = req.validatedParams || req.params;
    const updates = req.validatedBody || req.body;
    const user = await userService.updateUser(id, updates);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ data: user });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate field value', details: err.keyValue });
    }
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const q = req.validatedQuery || req.query;
    const page = q.page || 1;
    const pageSize = q.pageSize || q.limit || 10;
    const status = q.status;
    const result = await userService.listUsers({ page, pageSize, status });
    return res.json({ meta: { total: result.total, page: result.page, pages: result.pages, limit: result.limit }, data: result.users });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.validatedParams || req.params;
    const user = await userService.toggleStatus(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ data: user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
