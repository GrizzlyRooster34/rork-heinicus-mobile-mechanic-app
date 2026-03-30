import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  DATABASE_URL: process.env.DATABASE_URL,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
};

export const validatedEnv = envSchema.parse(env);
