const { z } = require('zod');

const email = z.string().trim().email('Enter a valid email');
const password = z.string().min(6, 'Password must be at least 6 characters').max(72);
const name = z.string().trim().min(1, 'Name is required').max(80);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Enter a valid phone number');
const city = z.string().trim().max(80).optional().nullable();

const signupBody = z.object({
  email,
  password,
  name,
  phone: phone.optional(),
});

const loginBody = z.object({
  email,
  password,
});

const completeProfileBody = z.object({
  phone: phone.optional(),
  city,
  name: name.optional(),
});

module.exports = { signupBody, loginBody, completeProfileBody };
