/* =====================================================
   IMAGE GENERATIVE AI — Auth Helper (Supabase)
   Replaces the old localStorage-based auth system.
   Depends on: supabase.js (must be loaded first)
   ===================================================== */

// ── In-memory session cache ───────────────────────────
let _cachedSession = null;

// ── Sign Up ──────────────────────────────────────────
async function authSignup(name, email, password) {
  if (!name || !email || !password)
    return { success: false, message: 'All fields are required.' };

  const sb = await getSupabase();
  if (!sb) return { success: false, message: 'Could not connect to the server. Try refreshing.' };

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name.trim() },
    },
  });

  if (error) {
    // Friendly messages for common Supabase errors
    if (error.message.includes('already registered') || error.message.includes('already exists'))
      return { success: false, message: 'An account with this email already exists.' };
    return { success: false, message: error.message };
  }

  // Some Supabase projects require email confirmation — handle gracefully
  if (data.user && !data.session) {
    return { success: true, requiresConfirmation: true };
  }

  _cachedSession = data.session;
  return { success: true, requiresConfirmation: false };
}

// ── Log In ───────────────────────────────────────────
async function authLogin(email, password) {
  if (!email || !password)
    return { success: false, message: 'Email and password are required.' };

  const sb = await getSupabase();
  if (!sb) return { success: false, message: 'Could not connect to the server. Try refreshing.' };

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials'))
      return { success: false, message: 'Incorrect email or password. Please try again.' };
    return { success: false, message: error.message };
  }

  _cachedSession = data.session;
  return { success: true };
}

// ── Log Out ──────────────────────────────────────────
async function authLogout() {
  const sb = await getSupabase();
  if (sb) await sb.auth.signOut();
  _cachedSession = null;
  window.location.href = 'login.html';
}

// ── Get current Supabase session ─────────────────────
async function authGetSessionAsync() {
  if (_cachedSession) return _cachedSession;
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  _cachedSession = data?.session ?? null;
  return _cachedSession;
}

// ── Synchronous helpers (use cached value) ────────────
// NOTE: these return the cached session set after login/signup/init.
// Always call authInitSession() on page load to prime the cache first.
function authGetSession() {
  return _cachedSession;
}

function authIsLoggedIn() {
  return _cachedSession !== null;
}

// ── Init — call on every page load ───────────────────
async function authInitSession() {
  const session = await authGetSessionAsync();
  _cachedSession = session;
  return session;
}

// ── Guards ───────────────────────────────────────────
async function authRequire() {
  const session = await authInitSession();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function authRedirectIfLoggedIn() {
  const session = await authInitSession();
  if (session) window.location.href = 'query.html';
}

// ── Convenience: get user object from session ─────────
function authGetUser() {
  const s = authGetSession();
  if (!s) return null;
  return {
    id:    s.user.id,
    email: s.user.email,
    name:  s.user.user_metadata?.full_name || s.user.email.split('@')[0],
    plan:  'free', // profile plan fetched separately if needed
  };
}
