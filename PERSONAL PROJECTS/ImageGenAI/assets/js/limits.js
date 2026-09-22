/* =====================================================
   IMAGE GENERATIVE AI — Usage Limits Helper (Supabase)
   Count is derived from actual rows in the images table.
   ===================================================== */

const FREE_PLAN_LIMIT = 5;

// In-memory usage cache (refreshed on page load)
let _usageCount = 0;

// ── Fetch count from Supabase ─────────────────────────
async function limitsRefreshCount() {
  const sb = await getSupabase();
  if (!sb) return 0;

  const session = authGetSession();
  if (!session) return 0;

  const { count, error } = await sb
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id);

  if (error) {
    console.warn('[limits] Could not fetch count:', error.message);
    return _usageCount; // fall back to cached
  }

  _usageCount = count ?? 0;
  return _usageCount;
}

// ── Getters (synchronous, use cached value) ───────────
function limitsGetCount() {
  return _usageCount;
}

function limitsGetMax() {
  // Always free for now; extend when pro plan is added
  return FREE_PLAN_LIMIT;
}

function limitsGetRemaining() {
  const max = limitsGetMax();
  if (max === Infinity) return Infinity;
  return Math.max(0, max - _usageCount);
}

function limitsIsReached() {
  const max = limitsGetMax();
  if (max === Infinity) return false;
  return _usageCount >= max;
}

function limitsGetUsagePercent() {
  const max = limitsGetMax();
  if (max === Infinity) return 0;
  return Math.min(100, Math.round((_usageCount / max) * 100));
}

// ── Increment local cache after a successful generation ──
function limitsIncrementLocal() {
  _usageCount += 1;
  return _usageCount;
}
