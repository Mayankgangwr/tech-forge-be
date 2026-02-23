import { z } from "zod";

const email = z.string().email().max(255).transform((value) => value.toLowerCase().trim());

const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Password must include uppercase, lowercase and number");

export const registerValidation = {
  body: z.object({
    email,
    password,
    firstName: z.string().min(1).max(100).trim(),
    lastName: z.string().min(1).max(100).trim(),
  }),
};

export const loginValidation = {
  body: z.object({
    email,
    password: z.string().min(1).max(72),
  }),
};

export const emptyBodyValidation = {
  body: z.object({}).passthrough(),
};

export const refreshValidation = {
  body: z
    .object({
      refreshToken: z.string().min(1).optional(),
    })
    .passthrough(),
};
