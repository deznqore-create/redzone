// REDZONE Supabase configuration
// Add your Supabase Project URL and Publishable (sb_publishable_...) key below.
// Never put a Secret / service_role key in browser JavaScript.
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

if (!window.supabase) {
  console.error("Supabase library is not loaded.");
} else if (SUPABASE_URL.startsWith("https://") && SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  window.supabaseClient = supabaseClient;
  console.log("REDZONE Supabase client initialized.");
} else {
  console.warn("Add your Supabase Project URL and Publishable Key in js/supabase.js.");
}
