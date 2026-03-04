import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente principal (para la sesión activa y consultas generales)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente secundario (solo para registro de terceros desde el panel Admin sin pisar la sesión actual)
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});
