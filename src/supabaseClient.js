import { createClient } from '@supabase/supabase-js';

// Binabasa ang nakalagay sa .env file (para sa localhost) o Environment Variables (para sa Vercel)
// May kasama ring direct fallback values para siguradong hindi mag-blanko ang koneksyon.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fvenpsusugppjihdkzyw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZW5wc3VzdWdwcGppaGRrenl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDg3ODMsImV4cCI6MjA5NjgyNDc4M30.fhUw24GSdti67oXBOG-vevdIrVa38LkR28dBbhFHU6w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);