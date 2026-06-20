const { ZodError } = require('zod');

function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.validatedBody = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation error', details: err.errors });
      }
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation error', details: err.errors });
      }
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.params);
      req.validatedParams = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation error', details: err.errors });
      }
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  };
}

module.exports = { validateBody, validateQuery, validateParams };
