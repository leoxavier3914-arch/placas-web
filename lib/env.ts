import { z } from 'zod';

const envSchema = z.object({
  COMPANY_ID: z.string({ required_error: 'COMPANY_ID not configured' }),
  DEFAULT_BRANCH_ID: z.string({ required_error: 'DEFAULT_BRANCH_ID not configured' }),
  NEXT_PUBLIC_SUPABASE_URL: z.string({ required_error: 'NEXT_PUBLIC_SUPABASE_URL not configured' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({ required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured' }),
  NODE_ENV: z.string().optional(),
});

const env = envSchema.parse(process.env);

export function getCompanyId() {
  return env.COMPANY_ID;
}

export default env;
