export const ImageTool = {
  id: 'image-tool',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-field">
        <label for="img-file">Choose an image</label>
        <input id="img-file" type="file" accept="image/*">
      </div>
      <div class="t-row">
        <div class="t-field"><label for="img-maxw">Max width (px)</label><input id="img-maxw" type="number" value="1200"></div>
        <div class="t-field"><label for="img-quality">Quality (%)</label><input id="img-quality" type="number" value="80" min="10" max="100"></div>
      </div>
      <canvas id="img-canvas" style="max-width:100%;display:none;border-radius:10px"></canvas>
      <div class="t-result" id="img-info">Image chunein.</div>
      <button class="t-btn" id="img-download" type="button" disabled>Download</button>
    `;

    const fileInput = container.querySelector('#img-file');
    const maxWEl = container.querySelector('#img-maxw');
    const qualityEl = container.querySelector('#img-quality');
    const canvas = container.querySelector('#img-canvas');
    const info = container.querySelector('#img-info');
    const downloadBtn = container.querySelector('#img-download');
    const ctx = canvas.getContext('2d');

    let objectUrl = null;
    let originalSize = 0;
    let origW = 0, origH = 0;

    function draw() {
      const maxW = Math.max(50, parseInt(maxWEl.value, 10) || 1200);
      const scale = Math.min(1, maxW / origW);
      canvas.width = Math.round(origW * scale);
      canvas.height = Math.round(origH * scale);
      canvas.style.display = 'block';
      info.textContent = `Original: ${origW}×${origH}px (${(originalSize / 1024).toFixed(1)} KB) → New: ${canvas.width}×${canvas.height}px`;
      downloadBtn.disabled = false;
    }

    const handleFile = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      originalSize = file.size;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        origW = im.width;
        origH = im.height;
        draw();
        const q = Math.max(0.1, Math.min(1, (parseInt(qualityEl.value, 10) || 80) / 100));
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
      };
      im.src = objectUrl;
    };

    const handleResizeChange = () => {
      if (!origW) return;
      const im = new Image();
      im.onload = () => {
        draw();
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
      };
      im.src = objectUrl;
    };

    const handleDownload = () => {
      const q = Math.max(0.1, Math.min(1, (parseInt(qualityEl.value, 10) || 80) / 100));
      canvas.toBlob((blob) => {
        if (blob) context.downloadFile(blob, 'compressed-image.jpg');
      }, 'image/jpeg', q);
    };

    fileInput.addEventListener('change', handleFile);
    maxWEl.addEventListener('change', handleResizeChange);
    downloadBtn.addEventListener('click', handleDownload);

    return () => {
      fileInput.removeEventListener('change', handleFile);
      maxWEl.removeEventListener('change', handleResizeChange);
      downloadBtn.removeEventListener('click', handleDownload);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  },
};

export default ImageTool;
