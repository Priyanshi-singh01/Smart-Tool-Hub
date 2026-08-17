export const QRCodeTool = {
  id: 'qr-code',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-field">
        <label for="qr-text">Text or URL</label>
        <input id="qr-text" type="text" placeholder="https://example.com">
      </div>
      <div id="qr-box" class="t-preview" style="display:flex;align-items:center;justify-content:center;min-height:220px">
        <span style="color:#8a978f;font-size:13px">Loading QR engine…</span>
      </div>
      <button class="t-btn secondary" id="qr-download" type="button" disabled>Download PNG</button>
    `;

    const input = container.querySelector('#qr-text');
    const box = container.querySelector('#qr-box');
    const downloadBtn = container.querySelector('#qr-download');

    let debounceTimer = null;
    let destroyed = false;

    try {
      await context.loadDependency.loadQRCode();
    } catch (err) {
      box.textContent = 'QR engine load nahi ho paya. Internet check karein.';
      return () => {}; // nothing else was set up
    }
    if (destroyed) return () => {}; // user navigated away while loading

    box.innerHTML = '';

    function render() {
      const value = input.value.trim();
      box.innerHTML = '';
      downloadBtn.disabled = true;
      if (!value) {
        box.innerHTML = '<span style="color:#8a978f;font-size:13px">Text ya URL likhein</span>';
        return;
      }
      // eslint-disable-next-line no-undef
      new QRCode(box, { text: value, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
      downloadBtn.disabled = false;
    }

    const handleInput = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, 250);
    };

    const handleDownload = () => {
      const canvas = box.querySelector('canvas');
      const img = box.querySelector('img');
      const src = canvas ? canvas.toDataURL('image/png') : img ? img.src : null;
      if (!src) return;
      fetch(src).then((r) => r.blob()).then((blob) => context.downloadFile(blob, 'qr-code.png'));
    };

    input.addEventListener('input', handleInput);
    downloadBtn.addEventListener('click', handleDownload);

    return () => {
      destroyed = true;
      clearTimeout(debounceTimer);
      input.removeEventListener('input', handleInput);
      downloadBtn.removeEventListener('click', handleDownload);
    };
  },
};

export default QRCodeTool;
