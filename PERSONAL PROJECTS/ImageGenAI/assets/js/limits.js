/* =====================================================
   IMAGE GENERATIVE AI — Usage Limits Helper
   ===================================================== */

const FREE_PLAN_LIMIT  = 5;
const LIMIT_KEY_PREFIX = 'iga_count_';

function _countKey() {
  const s = authGetSession();
  return s ? LIMIT_KEY_PREFIX + s.userId : null;
}

function limitsGetCount() {
  const key = _countKey();
  if (!key) return 0;
  return parseInt(localStorage.getItem(key) || '0', 10);
}

function limitsIncrement() {
  const key = _countKey();
  if (!key) return 0;
  const n = limitsGetCount() + 1;
  localStorage.setItem(key, String(n));
  return n;
}

function limitsGetMax() {
  const s = authGetSession();
  if (!s) return FREE_PLAN_LIMIT;
  return s.plan === 'pro' ? Infinity : FREE_PLAN_LIMIT;
}

function limitsGetRemaining() {
  const max = limitsGetMax();
  if (max === Infinity) return Infinity;
  return Math.max(0, max - limitsGetCount());
}

function limitsIsReached() {
  const max = limitsGetMax();
  if (max === Infinity) return false;
  return limitsGetCount() >= max;
}

function limitsGetUsagePercent() {
  const max = limitsGetMax();
  if (max === Infinity) return 0;
  return Math.min(100, Math.round((limitsGetCount() / max) * 100));
}
