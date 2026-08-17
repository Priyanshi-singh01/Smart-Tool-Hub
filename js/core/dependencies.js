/**
 * dependencies.js — loads external <script> libraries on demand and
 * caches them so the same library is never fetched/injected twice.
 *
 * IMPORTANT: we cache the in-flight PROMISE, not just a "loaded"
 * boolean. If two calls to loadScript() for the same URL happen
 * back-to-back before the first one finishes, both get the same
 * promise instead of injecting two <script> tags.
 */

const cache = new Map(); // url -> Promise<void>

function loadScript(url, globalCheck) {
  if (globalCheck && globalCheck()) {
    return Promise.resolve();
  }
  if (cache.has(url)) {
    return cache.get(url);
  }
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      cache.delete(url); // allow retry on next call
      reject(new Error(`Failed to load dependency: ${url}`));
    };
    document.head.appendChild(script);
  });
  cache.set(url, promise);
  return promise;
}

export const dependencies = {
  loadQRCode() {
    return loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
      () => typeof window.QRCode !== 'undefined'
    );
  },
  loadHtml2Canvas() {
    return loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      () => typeof window.html2canvas !== 'undefined'
    );
  },
  loadJsPDF() {
    return loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      () => typeof window.jspdf !== 'undefined'
    );
  },
  /** Load several deps in parallel: dependencies.loadAll(['loadQRCode','loadJsPDF']) */
  async loadAll(names) {
    await Promise.all(names.map((name) => dependencies[name]()));
  },
};
