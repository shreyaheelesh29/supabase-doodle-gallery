
console.log("Supabase.js loaded");

const SUPABASE_URL = "https://mfiyabgvptisffmfqcot.supabase.co";

const SUPABASE_KEY = "sb_publishable_u75AaMe9rYTc4G0tIjYZiw_LFgGqw7z";

window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log(window.db);