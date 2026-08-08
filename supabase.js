
console.log("Supabase.js loaded");

// ======================================
// Supabase Configuration
// ======================================

// Replace these with your own project details

const SUPABASE_URL = "https://mfiyabgvptisffmfqcot.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_u75AaMe9rYTc4G0tIjYZiw_LFgGqw7z";

// Create Supabase Client
if (window.supabase && typeof window.supabase.createClient === 'function') {
    const db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
    window.db = db;
    console.log("✅ Supabase Connected");
} else {
    console.warn("⚠️ Supabase SDK failed to load from CDN.");
    window.db = null;
}