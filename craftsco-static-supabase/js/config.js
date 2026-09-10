// DOPLŇ hodnoty ze Supabase Dashboard -> Project Settings -> API.
// Použij Project URL + Publishable key (u starších projektů anon key).
// NIKDY sem nedávej service_role / secret key.
window.SUPABASE_URL = "https://mruodnwdtuhssofzrfoj.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_soXX0o5PZ55EEO104F1Qcg_A-lz-l4Y";

function getSupabase() {
    return window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );
} 