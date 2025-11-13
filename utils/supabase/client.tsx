import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : '';

// Create a singleton instance of the Supabase client (no-op if credentials are missing)
const supabase = projectId && publicAnonKey
  ? createClient(supabaseUrl, publicAnonKey)
  : null;

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
};

export { supabase };

// Helper function to get the API base URL
export const getApiUrl = () => {
  if (!projectId) {
    throw new Error('Supabase projectId is not configured.');
  }
  return `https://${projectId}.supabase.co/functions/v1`;
};

// Helper function to get the full Edge Function URL
export const getFunctionUrl = (functionName: string = 'hyper-worker') => `${getApiUrl()}/${functionName}`;

// Helper function to make authenticated API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || publicAnonKey;

  // Ensure endpoint starts with /hyper-worker for the hyper-worker function
  const fullEndpoint = endpoint.startsWith('/hyper-worker') 
    ? endpoint 
    : `/hyper-worker${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(`${getApiUrl()}${fullEndpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};