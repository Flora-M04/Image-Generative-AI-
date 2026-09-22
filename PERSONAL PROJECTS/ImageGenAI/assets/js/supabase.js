/* =====================================================
   IMAGE GENERATIVE AI — Supabase Client Initializer
   Load this script FIRST on every page, before auth.js
   ===================================================== */

const SUPABASE_URL  = 'https://zepbnjqcbyswsgeokrcs.supabase.co';
const SUPABASE_ANON = 'sb_publishable_tDbGSD1gQ1CViProQ21h8w_eGELyurA';

// Load Supabase JS SDK via CDN (UMD build — exposes window.supabase as library namespace).
// We store the CLIENT on window._supabaseClient to avoid overwriting the namespace.
window._supabaseReady = new Promise((resolve) => {
  // If the SDK is already loaded and we already have a client, reuse it
  if (window._supabaseClient) {
    resolve(window._supabaseClient);
    return;
  }
  // If the SDK library is loaded but no client yet, create one
  if (window.supabase && window.supabase.createClient) {
    window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    resolve(window._supabaseClient);
    return;
  }
  // Otherwise dynamically load the SDK
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  script.onload = () => {
    window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    resolve(window._supabaseClient);
  };
  script.onerror = () => {
    console.error('[PixelMind] Failed to load Supabase SDK');
    resolve(null);
  };
  document.head.appendChild(script);
});

// Helper — await this before using supabase in any script
async function getSupabase() {
  return await window._supabaseReady;
}
