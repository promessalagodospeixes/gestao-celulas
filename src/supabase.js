import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wflazouqkyktunxralxc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbGF6b3Vxa3lrdHVueHJhbHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Mjg4MzEsImV4cCI6MjA5NTIwNDgzMX0.M6HuSC3uk7BwuStnTdkU_8ouyUbmas_EbaVxivAn26M'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
