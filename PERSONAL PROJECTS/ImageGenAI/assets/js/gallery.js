/* =====================================================
   IMAGE GENERATIVE AI — Gallery Page Logic (Supabase)
   Reads images from Supabase DB with filter, sort, delete.
   ===================================================== */

// ── Supabase Gallery Helpers ──────────────────────────

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
    console.error('[galleryLoad] Supabase error:', error.message);
    return [];
  }
  return data || [];
}

async function galleryDelete(id) {
  const sb      = await getSupabase();
  const session = authGetSession();
  if (!sb || !session) return;

  const { error } = await sb
    .from('images')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) console.error('[galleryDelete] Supabase error:', error.message);
}

async function galleryClear() {
  const sb      = await getSupabase();
  const session = authGetSession();
  if (!sb || !session) return;

  const { error } = await sb
    .from('images')
    .delete()
    .eq('user_id', session.user.id);

  if (error) console.error('[galleryClear] Supabase error:', error.message);
}

// ── DOM References ───────────────────────────────────
const grid         = document.getElementById('gallery-grid');
const emptyState   = document.getElementById('empty-state');
const countLabel   = document.getElementById('gallery-count');
const sortSelect   = document.getElementById('sort-select');
const searchInput  = document.getElementById('search-input');
const clearAllBtn  = document.getElementById('clear-all-btn');
const toastCont    = document.getElementById('toast-container');

// ── Toast ────────────────────────────────────────────
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  toastCont.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(60px)';
    t.style.transition = 'all 0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Format date ───────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Build a single image card ────────────────────────
function buildCard(img) {
  // Supabase column names: image_url, created_at (vs old imageUrl, generatedAt)
  const imageUrl = img.image_url || img.imageUrl || '';
  const createdAt = img.created_at || img.generatedAt || '';
  const model = img.model || 'ai';
  const prompt = img.prompt || '';

  const div = document.createElement('div');
  div.className = 'gallery-card';
  div.dataset.id = img.id;
  div.dataset.prompt = prompt.toLowerCase();         // used for search filtering
  div.dataset.promptOriginal = prompt;               // used for lightbox display
  div.innerHTML = `
    <div class="gallery-card-img-wrap">
      <img class="gallery-card-img" src="${imageUrl}"
           alt="Generated: ${prompt.substring(0, 60)}"
           loading="lazy"
           onerror="this.parentElement.innerHTML='<div class=gallery-img-error>⚠️ Image unavailable</div>'">
      <div class="gallery-card-overlay">
        <a href="${imageUrl}" download="pixelmind-${img.id}.png"
           class="btn btn-primary btn-sm overlay-btn" title="Download">
          ⬇ Download
        </a>
      </div>
    </div>
    <div class="gallery-card-body">
      <p class="gallery-card-prompt" title="${prompt}">${prompt}</p>
      <div class="gallery-card-meta">
        <span class="badge badge-purple" style="font-size:9px;">⚡ ${model.replace(/-/g,' ').toUpperCase()}</span>
        <span class="gallery-card-date">${formatDate(createdAt)}</span>
      </div>
      <div class="gallery-card-actions">
        <button class="btn btn-ghost btn-sm copy-prompt-btn" style="flex:1;" data-prompt="${prompt.replace(/"/g, '&quot;')}">
          📋 Copy Prompt
        </button>
        <button class="btn btn-sm delete-btn" data-id="${img.id}" title="Delete image"
                style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#f87171;">
          🗑
        </button>
      </div>
    </div>`;

  // Copy prompt
  div.querySelector('.copy-prompt-btn').addEventListener('click', function() {
    navigator.clipboard.writeText(prompt).then(() => {
      this.textContent = '✅ Copied!';
      setTimeout(() => { this.textContent = '📋 Copy Prompt'; }, 1500);
    });
  });

  // Delete
  div.querySelector('.delete-btn').addEventListener('click', async () => {
    div.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(async () => {
      await galleryDelete(img.id);
      await renderGallery();
      // Refresh usage count
      await limitsRefreshCount();
      syncSidebarUsage();
      showToast('Image deleted.', 'warn');
    }, 280);
  });

  return div;
}

// ── Keep track of all images in memory ────────────────
let _allImages = [];

// ── Render / filter gallery ───────────────────────────
async function renderGallery() {
  // Show loading state
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:3rem;">Loading gallery…</div>';
  emptyState.style.display = 'none';

  _allImages = await galleryLoad();

  const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const sort   = sortSelect ? sortSelect.value : 'newest';

  // Filter
  let filtered = search
    ? _allImages.filter(img => (img.prompt || '').toLowerCase().includes(search))
    : [..._allImages];

  // Sort
  if (sort === 'oldest') {
    filtered = filtered.reverse();
  }

  // Count
  if (countLabel) countLabel.textContent = `${filtered.length} image${filtered.length !== 1 ? 's' : ''}`;

  // Update clear button
  if (clearAllBtn) clearAllBtn.disabled = _allImages.length === 0;

  // Render
  grid.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';
  filtered.forEach(img => grid.appendChild(buildCard(img)));
}

// ── Lightbox ─────────────────────────────────────────
function openLightbox(src, prompt) {
  const lb       = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightbox-img');
  const lbPrompt = document.getElementById('lightbox-prompt');
  lbImg.src = src;
  lbPrompt.textContent = prompt;
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Sync sidebar usage UI ─────────────────────────────
function syncSidebarUsage() {
  const navUsageText = document.getElementById('nav-usage-text');
  const navUsageBar  = document.getElementById('nav-usage-bar');
  const el   = document.getElementById('usage-count');
  const fill = document.getElementById('usage-panel-fill');
  const rem  = document.getElementById('usage-remaining');

  const displayMax = limitsGetMax() === Infinity ? '∞' : limitsGetMax();
  if (navUsageText) navUsageText.textContent = `${limitsGetCount()} / ${displayMax} images`;
  if (navUsageBar)  navUsageBar.style.width  = `${limitsGetUsagePercent()}%`;
  if (el)   el.textContent = limitsGetCount();
  if (fill) {
    fill.style.width = `${limitsGetUsagePercent()}%`;
    fill.classList.toggle('danger', limitsGetUsagePercent() >= 80);
  }
  if (rem)  rem.textContent = limitsIsReached()
    ? '⚠️ Limit reached!'
    : `${limitsGetRemaining()} images remaining`;
}

// ── Init ─────────────────────────────────────────────
async function initGalleryPage() {
  // Auth guard — redirects to login.html if not logged in
  const ok = await authRequire();
  if (!ok) return;

  const user = authGetUser();

  // User info
  const userNameEl   = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  const userEmailEl  = document.getElementById('user-email');
  const logoutBtn    = document.getElementById('logout-btn');
  const topbarAvatar = document.getElementById('topbar-avatar');

  if (userNameEl)   userNameEl.textContent  = user.name;
  if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  if (userEmailEl)  userEmailEl.textContent  = user.email;
  if (topbarAvatar) topbarAvatar.textContent = user.name.charAt(0).toUpperCase();
  if (logoutBtn)    logoutBtn.addEventListener('click', authLogout);

  // Fetch usage count from DB then sync UI
  await limitsRefreshCount();
  syncSidebarUsage();

  // Sidebar upgrade btn
  const upgBtn = document.getElementById('upgrade-btn-sidebar');
  if (upgBtn) upgBtn.addEventListener('click', () => { window.location.href = 'index.html#pricing'; });

  // Initial gallery render
  await renderGallery();

  // Sort
  if (sortSelect) sortSelect.addEventListener('change', renderGallery);

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchInput._debounce);
      searchInput._debounce = setTimeout(renderGallery, 250);
    });
  }

  // Clear all
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
      if (!confirm('Delete ALL your generated images? This cannot be undone.')) return;
      await galleryClear();
      await limitsRefreshCount();
      syncSidebarUsage();
      await renderGallery();
      showToast('Gallery cleared.', 'warn');
    });
  }

  // Lightbox: open on image click
  grid.addEventListener('click', (e) => {
    const img = e.target.closest('.gallery-card-img');
    if (img) {
      const card   = img.closest('.gallery-card');
      const prompt = card.dataset.promptOriginal || card.dataset.prompt;
      openLightbox(img.src, prompt);
    }
  });

  // Lightbox close
  const lbClose = document.getElementById('lightbox-close');
  const lightbox = document.getElementById('lightbox');
  if (lbClose)  lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  // Sidebar toggle (mobile)
  const sidebar       = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarToggle.setAttribute('aria-expanded', sidebar.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
        sidebar.classList.remove('open');
        sidebarToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initGalleryPage);
