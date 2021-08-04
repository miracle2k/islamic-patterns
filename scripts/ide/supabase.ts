import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tatuqerrxqxasnlgnsjb.supabase.co'; //process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNDI4MDM4NSwiZXhwIjoxOTM5ODU2Mzg1fQ.OA5jb1Rfv2L_hFYIfR7xbafxQL8f5ZyHeUqYcSXlkpk"; //process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)