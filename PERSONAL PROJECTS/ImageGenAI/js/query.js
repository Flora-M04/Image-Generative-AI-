/* =====================================================
   IMAGE GENERATIVE AI — Query Page Logic
   Handles prompt submission, mock image generation,
   usage limit enforcement, and gallery rendering.
   ===================================================== */

// ── DOM References ────────────────────────────────────
const promptInput      = document.getElementById('prompt-input');
const generateBtn      = document.getElementById('generate-btn');
const gallery          = document.getElementById('gallery');
const emptyState       = document.getElementById('empty-state');
const limitModal       = document.getElementById('limit-modal');
const usageText        = document.getElementById('usage-text');
const usageBarFill     = document.getElementById('usage-bar-fill');
const navUsageText     = document.getElementById('nav-usage-text');
const navUsageBar      = document.getElementById('nav-usage-bar');
const charCount        = document.getElementById('char-count');
const toastContainer   = document.getElementById('toast-container');
const userNameEl       = document.getElementById('user-name');
const userAvatarEl     = document.getElementById('user-avatar');
const userEmailEl      = document.getElementById('user-email');
const logoutBtn        = document.getElementById('logout-btn');

// ── Picsum seeds for "generating" different images ───
// We use prompt-derived numbers so the same prompt → same result (deterministic)
function promptToSeed(prompt) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash) + prompt.charCodeAt(i);
    hash |= 0;
  }
  // Use absolute value and add a random offset so repeated same prompts vary
  return (Math.abs(hash) + Date.now()) % 1000;
}

// ── Image URL generators (uses picsum as stand-in) ──
const IMAGE_STYLES = [
  (seed) => `https://picsum.photos/seed/${seed}/512/512`,
  (seed) => `https://picsum.photos/seed/${seed + 100}/512/512`,
  (seed) => `https://picsum.photos/seed/${seed + 200}/512/512`,
];

function getMockImageUrl(prompt) {
  const seed  = promptToSeed(prompt);
  const style = IMAGE_STYLES[seed % IMAGE_STYLES.length];
  return style(seed);
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
  }, 3500);
}

// ── Update usage UI ──────────────────────────────────
function updateUsageUI() {
  const count   = limitsGetCount();
  const max     = limitsGetMax();
  const pct     = limitsGetUsagePercent();
  const reached = limitsIsReached();

  const displayMax = max === Infinity ? '∞' : max;
  const label = `${count} / ${displayMax} images`;

  if (usageText)    usageText.textContent    = label;
  if (navUsageText) navUsageText.textContent = label;

  [usageBarFill, navUsageBar].forEach(bar => {
    if (!bar) return;
    bar.style.width = `${Math.min(pct, 100)}%`;
    bar.classList.toggle('danger', pct >= 80);
  });

  if (generateBtn) {
    generateBtn.disabled = reached;
    generateBtn.querySelector('.btn-label').textContent =
      reached ? '⚠️ Limit Reached' : '✨ Generate Image';
  }
}

// ── Skeleton card ────────────────────────────────────
function createSkeletonCard() {
  const div = document.createElement('div');
  div.className = 'image-card';
  div.id = 'skeleton-card';
  div.innerHTML = `
    <div class="skeleton" style="width:100%; aspect-ratio:1;"></div>
    <div class="image-card-body" style="display:flex;flex-direction:column;gap:8px;">
      <div class="skeleton" style="height:12px; width:90%;"></div>
      <div class="skeleton" style="height:12px; width:60%;"></div>
      <div class="skeleton" style="height:30px; width:80%; margin-top:4px;"></div>
    </div>`;
  return div;
}

// ── Render generated image card ───────────────────────
function createImageCard(imageUrl, prompt) {
  const div = document.createElement('div');
  div.className = 'image-card';
  div.innerHTML = `
    <div style="position:relative; overflow:hidden;">
      <img class="image-card-img" src="${imageUrl}" alt="Generated: ${prompt}"
           loading="lazy" onerror="this.src='https://picsum.photos/seed/42/512/512'">
      <div style="position:absolute;top:8px;right:8px;">
        <span class="badge badge-purple" style="font-size:9px;">AI Generated</span>
      </div>
    </div>
    <div class="image-card-body">
      <p class="image-card-prompt" title="${prompt}">${prompt}</p>
      <div class="image-card-actions">
        <a href="${imageUrl}" download="ai-image.jpg" target="_blank"
           class="btn btn-outline btn-sm" style="flex:1; text-align:center;">
          ⬇ Download
        </a>
        <button class="btn btn-ghost btn-sm" onclick="copyPrompt(this, '${prompt.replace(/'/g, "\\'")}')">
          📋
        </button>
      </div>
    </div>`;
  return div;
}

function copyPrompt(btn, prompt) {
  navigator.clipboard.writeText(prompt).then(() => {
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = '📋'; }, 1500);
  });
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

  // UI loading state
  generateBtn.classList.add('btn-loading');
  generateBtn.disabled = true;
  promptInput.disabled = true;

  // Show skeleton
  if (emptyState) emptyState.style.display = 'none';
  const skeleton = createSkeletonCard();
  gallery.prepend(skeleton);

  // Simulate AI generation delay (2–3 seconds)
  const delay = 2000 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Get mock image URL
  const imageUrl = getMockImageUrl(prompt);

  // Increment count
  const newCount = limitsIncrement();
  updateUsageUI();

  // Remove skeleton & add real card
  skeleton.remove();
  const card = createImageCard(imageUrl, prompt);
  gallery.prepend(card);

  // Reset input
  promptInput.value = '';
  charCount.textContent = '0 / 500';

  // Show feedback
  showToast('Image generated successfully! 🎉', 'success');

  // Restore buttons
  generateBtn.classList.remove('btn-loading');
  promptInput.disabled = false;

  if (!limitsIsReached()) {
    generateBtn.disabled = false;
  }

  // Check limit after generation
  if (limitsIsReached()) {
    setTimeout(showLimitModal, 800);
  }

  // Scroll gallery into view
  gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Limit Modal ───────────────────────────────────────
function showLimitModal() {
  if (limitModal) limitModal.classList.remove('hidden');
}

function hideLimitModal() {
  if (limitModal) limitModal.classList.add('hidden');
}

// ── Init page ─────────────────────────────────────────
function initQueryPage() {
  // Auth guard
  if (!authRequire()) return;

  const session = authGetSession();

  // Populate user info
  if (userNameEl)   userNameEl.textContent  = session.name;
  if (userAvatarEl) userAvatarEl.textContent = session.name.charAt(0).toUpperCase();
  if (userEmailEl)  userEmailEl.textContent  = session.email;
  if (logoutBtn)    logoutBtn.addEventListener('click', authLogout);

  // Update usage UI
  updateUsageUI();

  // Show limit modal on load if already hit limit
  if (limitsIsReached()) {
    setTimeout(showLimitModal, 500);
  }

  // Char counter
  promptInput.addEventListener('input', () => {
    const len = promptInput.value.length;
    charCount.textContent = `${len} / 500`;
    if (len > 450) charCount.style.color = 'var(--accent-pink)';
    else charCount.style.color = 'var(--text-muted)';
  });

  // Generate on Enter (Ctrl+Enter or Cmd+Enter)
  promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      generateImage();
    }
  });

  // Generate button
  generateBtn.addEventListener('click', generateImage);
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', initQueryPage);
