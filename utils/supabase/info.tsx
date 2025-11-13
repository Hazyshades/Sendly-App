export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
export const publicAnonKey = import.meta.env.VITE_SUPABASE_PUBLIC_ANON_KEY || '';

if (!projectId || !publicAnonKey) {
  console.warn('[Supabase] No variables VITE_SUPABASE_PROJECT_ID or VITE_SUPABASE_PUBLIC_ANON_KEY are set. Supabase functionality will be limited.');
}