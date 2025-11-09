import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqatwjjnmhutgoevedir.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYXR3ampubWh1dGdvZXZlZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzEzNzMsImV4cCI6MjA3ODI0NzM3M30.BxSxGkgvhhWMoETjcnbLmvnv-OqTBxwWoAA3BveGF10';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

