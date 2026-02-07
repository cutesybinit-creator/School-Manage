
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvyaiivertvovijakrey.supabase.co';
const supabaseAnonKey = 'sb_publishable_h7uw00u7Kt2mgZNLflpOzQ_Jmcvx0rD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
