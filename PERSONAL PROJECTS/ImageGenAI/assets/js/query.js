/* =====================================================
   IMAGE GENERATIVE AI — Query Page Logic
   Connected to Cloudflare Worker backend for real AI
   image generation via Workers AI (Flux / SDXL).
   Worker URL: https://pixelmind-ai-worker.ahana13-ad.workers.dev
   Images saved to Supabase DB (images table).
   ===================================================== */

// ── Worker API Config ────────────────────────────────
const WORKER_BASE_URL = 'https://pixelmind-ai-worker.ahana13-ad.workers.dev';
const API_GENERATE    = `${WORKER_BASE_URL}/api/generate`;
const API_HEALTH      = `${WORKER_BASE_URL}/api/health`;
const DEFAULT_MODEL   = 'flux-schnell';

// ── Save image to Supabase ────────────────────────────
async function gallerySave(imageUrl, prompt, model) {
  const sb      = await getSupabase();
  const session = authGetSession();
  if (!sb || !session) return null;

  const entry = {
    user_id:   session.user.id,
    prompt,
    image_url: imageUrl,
    model:     model || DEFAULT_MODEL,
  };

  const { data, error } = await sb.from('images').insert(entry).select().single();
  if (error) {
    console.error('[gallerySave] Supabase insert error:', error.message);
    return null;
  }
  return data;
}

// ── Load images from Supabase ─────────────────────────
async function galleryLoad() {
  const sb      = await getSupabase();
  const session = authGetSession();
  if (!sb || !session) return [];

  const { data, error } = await sb
    .from('images')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[galleryLoad] Supabase select error:', error.message);
    return [];
  }
  return data || [];
}

// ── DOM References ───────────────────────────────────
const promptInput    = document.getElementById('prompt-input');
const generateBtn    = document.getElementById('generate-btn');
const charCount      = document.getElementById('char-count');
const toastContainer = document.getElementById('toast-container');
const userNameEl     = document.getElementById('user-name');
const userAvatarEl   = document.getElementById('user-avatar');
const userEmailEl    = document.getElementById('user-email');
const logoutBtn      = document.getElementById('logout-btn');
const limitModal     = document.getElementById('limit-modal');
const navUsageText   = document.getElementById('nav-usage-text');
const navUsageBar    = document.getElementById('nav-usage-bar');

// ── Worker health check ──────────────────────────────
async function checkWorkerHealth() {
  try {
    const res = await fetch(API_HEALTH, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// ── Toast ────────────────────────────────────────────
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Update usage UI ──────────────────────────────────
function updateUsageUI() {
  const count      = limitsGetCount();
  const max        = limitsGetMax();
  const pct        = limitsGetUsagePercent();
  const reached    = limitsIsReached();
  const displayMax = max === Infinity ? '∞' : max;
  const label      = `${count} / ${displayMax} images`;

  if (navUsageText) navUsageText.textContent = label;

  if (navUsageBar) {
    navUsageBar.style.width = `${Math.min(pct, 100)}%`;
    navUsageBar.classList.toggle('danger', pct >= 80);
  }

  if (generateBtn) {
    generateBtn.disabled = reached;
    generateBtn.querySelector('.btn-label').textContent =
      reached ? '⚠️ Limit Reached' : '✨ Generate Image';
  }
}

// ── Skeleton while generating ────────────────────────
function showGeneratingSkeleton() {
  const wrapper = document.getElementById('generating-indicator');
  if (wrapper) wrapper.style.display = 'flex';
}

function hideGeneratingSkeleton() {
  const wrapper = document.getElementById('generating-indicator');
  if (wrapper) wrapper.style.display = 'none';
}

// ── Main generate function ────────────────────────────
async function generateImage() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showToast('Please enter a prompt first.', 'warn');
    promptInput.focus();
    return;
  }

  if (limitsIsReached()) {
    showLimitModal();
    return;
  }

  // UI: loading
  generateBtn.classList.add('btn-loading');
  generateBtn.disabled = true;
  promptInput.disabled = true;
  showGeneratingSkeleton();

  try {
    showToast('Sending to AI… this may take a few seconds ⚡', 'info');

    const response = await fetch(API_GENERATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: DEFAULT_MODEL }),
      signal: AbortSignal.timeout(60000),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Save image to Supabase DB
    const saved = await gallerySave(data.image, prompt, data.model || DEFAULT_MODEL);
    if (!saved) {
      showToast('⚠ Image generated but could not be saved to gallery.', 'warn');
    }

    // Increment local usage cache & re-fetch accurate count from DB
    limitsIncrementLocal();
    await limitsRefreshCount();
    updateUsageUI();

    // Reset input
    promptInput.value = '';
    charCount.textContent = '0 / 500';

    showToast('✨ Image generated & saved to your gallery!', 'success');

    // Highlight the gallery link button
    const viewBtn = document.getElementById('view-gallery-btn');
    if (viewBtn) {
      const images = await galleryLoad();
      viewBtn.style.background   = 'rgba(124,58,237,0.15)';
      viewBtn.style.borderColor  = 'var(--primary-500)';
      viewBtn.textContent        = `🖼️ View Gallery (${images.length} images) →`;
      viewBtn.style.animation    = 'none';
      requestAnimationFrame(() => {
        viewBtn.style.transition = 'all 0.3s ease';
        viewBtn.style.transform  = 'scale(1.04)';
        setTimeout(() => { viewBtn.style.transform = ''; }, 300);
      });
    }

    // Check if limit now reached
    if (limitsIsReached()) {
      setTimeout(showLimitModal, 800);
    }

  } catch (err) {
    console.error('[generate] error:', err);
    const msg = err.name === 'TimeoutError'
      ? 'Generation timed out. The model may be busy — please try again.'
      : `Generation failed: ${err.message}`;
    showToast(msg, 'error');
  } finally {
    hideGeneratingSkeleton();
    generateBtn.classList.remove('btn-loading');
    promptInput.disabled = false;
    if (!limitsIsReached()) generateBtn.disabled = false;
  }
}

// ── Limit Modal ───────────────────────────────────────
function showLimitModal() {
  if (limitModal) limitModal.classList.remove('hidden');
}
function hideLimitModal() {
  if (limitModal) limitModal.classList.add('hidden');
}

// ── Init page ─────────────────────────────────────────
async function initQueryPage() {
  // Auth guard — redirects to login.html if not logged in
  const ok = await authRequire();
  if (!ok) return;

  const user = authGetUser();

  if (userNameEl)   userNameEl.textContent  = user.name;
  if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  if (userEmailEl)  userEmailEl.textContent  = user.email;
  if (logoutBtn)    logoutBtn.addEventListener('click', authLogout);

  // Load usage count from DB
  await limitsRefreshCount();
  updateUsageUI();

  if (limitsIsReached()) setTimeout(showLimitModal, 500);

  const closeBtn = document.getElementById('close-limit-modal');
  if (closeBtn) closeBtn.addEventListener('click', hideLimitModal);

  // Char counter
  promptInput.addEventListener('input', () => {
    const len = promptInput.value.length;
    charCount.textContent = `${len} / 500`;
    charCount.style.color = len > 450 ? 'var(--accent-pink)' : 'var(--text-muted)';
  });

  // Ctrl+Enter to generate
  promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generateImage();
  });

  generateBtn.addEventListener('click', generateImage);

  // Update gallery button count on load
  const viewBtn = document.getElementById('view-gallery-btn');
  if (viewBtn) {
    const images = await galleryLoad();
    if (images.length > 0) {
      viewBtn.textContent = `🖼️ View Gallery (${images.length} images) →`;
    }
  }

  // Worker health check (non-blocking)
  checkWorkerHealth().then(online => {
    if (!online) showToast('⚠ AI backend unreachable — check Worker deployment.', 'warn');
    else console.log('[pixelmind] Worker API is online ✅');
  });
}

document.addEventListener('DOMContentLoaded', initQueryPage);
