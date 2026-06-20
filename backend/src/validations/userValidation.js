const { z } = require('zod');

const baseSchema = {
  employee_code: z.string().min(6, 'employee_code must be at least 6 characters'),
  name: z.string().min(1, 'name is required'),
  email: z.string().email('Invalid email'),
  phone_number: z.string().refine((v) => v && v.length === 10, { message: 'phone_number must be 10 digits' }),
  date_of_birth: z.string().optional().refine((v) => {
    if (!v) return true; 
    const d = new Date(v);
    const now = new Date();
    return !(d.toDateString() === now.toDateString());
  }, { message: 'date_of_birth must not be the current date' }),
  status: z.enum(['active','inactive']).optional(),
};

const createUserSchema = z.object(baseSchema);

const updateUserSchema = z.object({
  employee_code: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone_number: z.string().refine((v) => !v || v.length === 10, { message: 'phone_number must be 10 digits' }).optional(),
  date_of_birth: z.string().refine((v) => {
    if (!v) return true;
    const d = new Date(v);
    const now = new Date();
    return !(d.toDateString() === now.toDateString());
  }, { message: 'date_of_birth must not be the current date' }).optional(),
  status: z.enum(['active','inactive']).optional(),
});

const idParam = z.object({ id: z.string().min(1) });

const listQuery = z.object({
  page: z.preprocess((v) => v ? parseInt(String(v), 10) : undefined, z.number().int().positive().optional()),
  pageSize: z.preprocess((v) => v ? parseInt(String(v), 10) : undefined, z.number().int().positive().optional()),
  status: z.enum(['active','inactive']).optional(),
}).refine((obj) => {
  return true;
});

module.exports = { createUserSchema, updateUserSchema, idParam, listQuery };
