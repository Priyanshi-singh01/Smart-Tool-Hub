import { TOOL_REGISTRY, getAllCategories, getToolById, validateRegistry } from './core/tool-registry.js';
import { loadTool } from './core/tool-loader.js';
import { createRouter } from './core/router.js';
import { storage } from './core/storage.js';
import { toast } from './core/notifications.js';
import { dependencies } from './core/dependencies.js';

// ---------- dev-mode registry validation (fails loudly, never silently) ----------
try {
  validateRegistry();
} catch (err) {
  console.error(err);
  toast('Tool registry has a configuration error — check console.', { type: 'error', duration: 6000 });
}

// ---------- DOM refs ----------
const $ = (id) => document.getElementById(id);
const viewDashboard = $('view-dashboard');
const viewWorkspace = $('view-workspace');
const searchInput = $('search-input');
const categoryBar = $('category-bar');
const gridAll = $('grid-all');
const gridAllTitle = $('grid-all-title');
const gridFavorites = $('grid-favorites');
const gridRecent = $('grid-recent');
const sectionFavorites = $('section-favorites');
const sectionRecent = $('section-recent');
const emptyState = $('empty-state');

const wsIcon = $('ws-icon');
const wsTitle = $('ws-title');
const wsDesc = $('ws-desc');
const wsMount = $('ws-mount');
const wsLoading = $('ws-loading');
const wsError = $('ws-error');
const btnBack = $('btn-back');
const btnFavToggle = $('btn-fav-toggle');

// ---------- state ----------
let activeCategory = null; // null = all
let activeCleanup = null; // cleanup fn returned by the currently mounted tool
let activeToolId = null;
let navToken = 0; // monotonically increasing token guarding against stale async mounts

// ==================================================================
// CONTEXT — the only surface tool modules are allowed to use to talk
// to the outside world. Tools must not touch dashboard/router/
// favorites/recent/theme state directly.
// ==================================================================
function buildContext(toolId) {
  return {
    toolId,
    navigate: (path) => router.navigate(path),
    toast,
    loadDependency: dependencies,
    downloadFile(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },
    print(el) {
      window.print(); // simple v1: whole-page print; tool controls @media print styling
    },
  };
}

// ==================================================================
// DASHBOARD RENDERING — everything derives from the registry.
// ==================================================================
function matchesQuery(tool, query) {
  if (!query) return true;
  const haystack = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function renderCard(tool) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'hub-card';
  card.setAttribute('data-tool-id', tool.id);

  const isFav = storage.isFavorite(tool.id);

  card.innerHTML = `
    <button type="button" class="hub-card__fav" aria-label="Favorite toggle" aria-pressed="${isFav}">${isFav ? '★' : '☆'}</button>
    <span class="hub-card__icon">${tool.icon}</span>
    <span class="hub-card__name">${tool.name}</span>
    <p class="hub-card__desc">${tool.description}</p>
    <span class="hub-card__cat">${tool.category}</span>
  `;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.hub-card__fav')) return; // handled separately
    router.navigate(`/tools/${tool.id}`);
  });

  card.querySelector('.hub-card__fav').addEventListener('click', (e) => {
    e.stopPropagation();
    const nowFav = storage.toggleFavorite(tool.id);
    toast(nowFav ? `${tool.name} favorites mein add ho gaya` : `${tool.name} favorites se hata diya`);
    renderDashboard(); // re-derive everything from storage + registry
  });

  return card;
}

function renderGrid(container, tools) {
  container.innerHTML = '';
  tools.forEach((tool) => container.appendChild(renderCard(tool)));
}

function renderCategoryBar() {
  categoryBar.innerHTML = '';
  const categories = ['All', ...getAllCategories()];
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hub-chip';
    chip.textContent = cat;
    const isActive = (cat === 'All' && !activeCategory) || cat === activeCategory;
    chip.setAttribute('aria-pressed', String(isActive));
    chip.addEventListener('click', () => {
      activeCategory = cat === 'All' ? null : cat;
      renderDashboard();
    });
    categoryBar.appendChild(chip);
  });
}

function renderDashboard() {
  renderCategoryBar();

  const query = searchInput.value.trim();
  let filtered = TOOL_REGISTRY.filter((t) => matchesQuery(t, query));
  if (activeCategory) filtered = filtered.filter((t) => t.category === activeCategory);

  gridAllTitle.textContent = activeCategory ? activeCategory : 'All Tools';
  renderGrid(gridAll, filtered);
  emptyState.hidden = filtered.length !== 0;

  const favIds = storage.getFavorites();
  const favTools = favIds.map(getToolById).filter(Boolean).filter((t) => matchesQuery(t, query));
  sectionFavorites.hidden = favTools.length === 0;
  renderGrid(gridFavorites, favTools);

  const recentIds = storage.getRecentTools();
  const recentTools = recentIds.map(getToolById).filter(Boolean).filter((t) => matchesQuery(t, query));
  sectionRecent.hidden = recentTools.length === 0;
  renderGrid(gridRecent, recentTools);
}

searchInput.addEventListener('input', renderDashboard);

// ==================================================================
// WORKSPACE — mount/unmount lifecycle, race-safe against fast
// navigation while a tool is still asynchronously mounting.
// ==================================================================
function showDashboardView() {
  viewWorkspace.hidden = true;
  viewDashboard.hidden = false;
}

function showWorkspaceView() {
  viewDashboard.hidden = true;
  viewWorkspace.hidden = false;
}

async function teardownActiveTool() {
  if (activeCleanup) {
    try {
      await activeCleanup();
    } catch (err) {
      console.error('[app] cleanup threw for', activeToolId, err);
    }
  }
  activeCleanup = null;
  activeToolId = null;
  wsMount.innerHTML = '';
}

async function openTool(toolId) {
  const myToken = ++navToken; // this navigation "owns" this token

  const tool = getToolById(toolId);
  if (!tool) {
    toast('Tool nahi mila.', { type: 'error' });
    router.navigate('/tools');
    return;
  }

  await teardownActiveTool();

  showWorkspaceView();
  wsIcon.textContent = tool.icon;
  wsTitle.textContent = tool.name;
  wsDesc.textContent = tool.description;
  btnFavToggle.setAttribute('aria-pressed', String(storage.isFavorite(tool.id)));
  btnFavToggle.textContent = storage.isFavorite(tool.id) ? '★' : '☆';

  wsError.hidden = true;
  wsLoading.hidden = false;
  wsMount.hidden = true;

  try {
    const loaded = await loadTool(tool);

    // STALE-MOUNT GUARD: if the user navigated again while this
    // async load was in flight, our token is no longer current —
    // abandon silently instead of mounting into a workspace the
    // user has already left, and instead of clobbering whatever
    // *did* mount in the meantime.
    if (myToken !== navToken) return;

    const cleanup = await loaded.mount(wsMount, buildContext(tool.id));

    if (myToken !== navToken) {
      // Navigated away again before mount() resolved — clean up
      // what we just mounted instead of leaving it active.
      if (typeof cleanup === 'function') {
        try { await cleanup(); } catch (e) { console.error(e); }
      }
      return;
    }

    activeCleanup = typeof cleanup === 'function' ? cleanup : null;
    activeToolId = tool.id;
    storage.addRecentTool(tool.id);

    wsLoading.hidden = true;
    wsMount.hidden = false;
  } catch (err) {
    if (myToken !== navToken) return;
    console.error(`[app] failed to load tool "${toolId}"`, err);
    wsLoading.hidden = true;
    wsError.hidden = false;
  }
}

btnBack.addEventListener('click', () => router.navigate('/tools'));
$('ws-error-back').addEventListener('click', () => router.navigate('/tools'));
$('ws-retry').addEventListener('click', () => openTool(activeToolId || lastRequestedToolId));

btnFavToggle.addEventListener('click', () => {
  if (!activeToolId) return;
  const nowFav = storage.toggleFavorite(activeToolId);
  btnFavToggle.setAttribute('aria-pressed', String(nowFav));
  btnFavToggle.textContent = nowFav ? '★' : '☆';
});

let lastRequestedToolId = null;

// ==================================================================
// ROUTER WIRING — router has zero tool-specific knowledge.
// ==================================================================
const router = createRouter({
  onDashboard: async () => {
    navToken++; // invalidate any in-flight tool mount
    await teardownActiveTool();
    showDashboardView();
    renderDashboard();
  },
  onTool: (toolId) => {
    lastRequestedToolId = toolId;
    openTool(toolId);
  },
});

router.start();
