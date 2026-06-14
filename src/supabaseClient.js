import { createClient } from '@supabase/supabase-js';

// Naka-set up na ang URL mo base sa screenshot. I-paste mo naman ang Anon Key sa ibaba!
const supabaseUrl = 'https://fvenpsusugppjihdkzyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZW5wc3VzdWdwcGppaGRrenl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDg3ODMsImV4cCI6MjA5NjgyNDc4M30.fhUw24GSdti67oXBOG-vevdIrVa38LkR28dBbhFHU6w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);