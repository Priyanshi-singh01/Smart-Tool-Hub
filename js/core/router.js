/**
 * router.js — generic hash router.
 *
 * Routes:
 *   #/tools            -> dashboard
 *   #/tools/<tool-id>   -> open that tool
 *
 * The router has NO if/else on tool ids. It just parses the hash and
 * calls the handler with whatever id it found; app.js decides what
 * to do with that id via the registry.
 */

export function createRouter({ onDashboard, onTool }) {
  function parseHash() {
    const hash = window.location.hash || '#/tools';
    const match = hash.match(/^#\/tools\/([a-zA-Z0-9_-]+)\/?$/);
    if (match) {
      onTool(match[1]);
    } else {
      onDashboard();
    }
  }

  function navigate(path) {
    // path like "/tools" or "/tools/id-card"
    const target = `#${path}`;
    if (window.location.hash === target) {
      // Already there — still re-run in case of a forced refresh open.
      parseHash();
    } else {
      window.location.hash = target;
    }
  }

  window.addEventListener('hashchange', parseHash);

  return {
    start: parseHash,
    navigate,
  };
}
