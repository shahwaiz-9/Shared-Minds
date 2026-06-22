import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://wepvrqqxusltbbbtolxi.supabase.co';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcHZycXF4dXNsdGJiYnRvbHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIyNDEsImV4cCI6MjA5Njk4ODI0MX0.rlntRTxSg0foGKqzr_RWrpz9h8AbbTC-PGPnRGAq4Lg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);