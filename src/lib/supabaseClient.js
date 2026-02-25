import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Asegúrate de que no haya espacios en blanco en las variables
export const supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim())