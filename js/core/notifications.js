let regionEl = null;

function getRegion() {
  if (!regionEl) regionEl = document.getElementById('toast-region');
  return regionEl;
}

/**
 * toast(message, { type: 'info'|'error', duration })
 * Safe to call from any tool module; owns its own DOM/timers.
 */
export function toast(message, opts = {}) {
  const region = getRegion();
  if (!region) return;

  const { type = 'info', duration = 2600 } = opts;
  const el = document.createElement('div');
  el.className = `hub-toast${type === 'error' ? ' error' : ''}`;
  el.textContent = message;
  region.appendChild(el);

  requestAnimationFrame(() => el.classList.add('show'));

  const remove = () => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 220);
  };
  setTimeout(remove, duration);
}
