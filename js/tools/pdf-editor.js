/**
 * pdf-editor.js
 * PDF Editor tool module for Smart Tools Hub.
 * Runs entirely in the browser; PDFs are not uploaded to a server.
 */
export const PdfEditor = {
  id: 'pdf-editor',

  async mount(container, context) {
    await loadDependencies();

    container.innerHTML = `
      <style>
        .pdf-editor {
          --pdf-bg:#F4F1EA; --pdf-panel:#FFFFFF; --pdf-ink:#1E1B16;
          --pdf-muted:#7A7368; --pdf-accent:#D97757; --pdf-border:#DEDACD;
          --pdf-danger:#B3432B; --pdf-edited:#FFF3CD;
          background:var(--pdf-bg); color:var(--pdf-ink); border:1px solid var(--pdf-border);
          border-radius:14px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
        }
        .pdf-editor * { box-sizing:border-box; }
        .pdf-editor__header {
          padding:18px 22px; border-bottom:1px solid var(--pdf-border);
          display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
        }
        .pdf-editor h3 { margin:0; font-size:19px; font-weight:650; }
        .pdf-editor__sub { font-size:12px; color:var(--pdf-muted); margin-top:4px; }
        .pdf-editor button {
          background:var(--pdf-panel); border:1px solid var(--pdf-border); color:var(--pdf-ink);
          padding:8px 13px; border-radius:7px; font-size:13px; cursor:pointer; font-weight:500;
        }
        .pdf-editor button:hover { border-color:var(--pdf-accent); }
        .pdf-editor button:disabled { opacity:.45; cursor:not-allowed; }
        .pdf-editor .pdf-primary { background:var(--pdf-accent); color:#fff; border-color:var(--pdf-accent); }
        .pdf-editor .pdf-danger { color:var(--pdf-danger); border-color:#E7C3B8; }
        .pdf-editor input[type=file] { display:none; }
        .pdf-editor__filelabel {
          display:inline-block; background:var(--pdf-accent); color:#fff; padding:8px 15px;
          border-radius:7px; font-size:13px; cursor:pointer; font-weight:500;
        }
        .pdf-editor__toolbar {
          display:flex; gap:8px; flex-wrap:wrap; padding:11px 22px;
          border-bottom:1px solid var(--pdf-border); align-items:center;
        }
        .pdf-editor__hint { font-size:12px; color:var(--pdf-muted); }
        .pdf-editor__nav {
          display:flex; align-items:center; justify-content:center; gap:10px;
          padding:10px 22px; border-bottom:1px solid var(--pdf-border);
        }
        .pdf-editor__status { font-size:12px; color:var(--pdf-muted); padding:8px 22px 0; min-height:26px; }
        .pdf-editor__empty { text-align:center; color:var(--pdf-muted); padding:65px 20px; font-size:14px; }
        .pdf-editor__viewer { display:flex; justify-content:center; padding:22px; overflow:auto; }
        .pdf-editor__stack { position:relative; box-shadow:0 1px 6px rgba(0,0,0,.12); background:#fff; flex:0 0 auto; }
        .pdf-editor__canvas { display:block; }
        .pdf-editor__textlayer { position:absolute; top:0; left:0; right:0; bottom:0; }
        .pdf-editor__tspan {
          position:absolute; white-space:pre; cursor:text; outline:none; color:#111;
          font-family:sans-serif; background:transparent;
        }
        .pdf-editor__tspan:hover { background:rgba(217,119,87,.12); }
        .pdf-editor__tspan.edited { background:var(--pdf-edited); }
        .pdf-editor__tspan:focus { background:#fff; box-shadow:0 0 0 1px var(--pdf-accent); z-index:5; }
        .pdf-editor__newbox {
          position:absolute; background:#fff; border:1px dashed var(--pdf-accent); padding:2px 4px;
          font-size:14px; min-width:60px; outline:none; z-index:6;
        }
      </style>

      <div class="pdf-editor">
        <div class="pdf-editor__header">
          <div>
            <h3>PDF Editor</h3>
            <div class="pdf-editor__sub">Edit text, add new text, rotate pages or delete pages directly in your browser.</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <label class="pdf-editor__filelabel" for="pdf-editor-file">Open PDF</label>
            <input type="file" id="pdf-editor-file" accept="application/pdf">
            <button class="pdf-primary" id="pdf-editor-download" disabled>Download Edited PDF</button>
          </div>
        </div>

        <div class="pdf-editor__toolbar" id="pdf-editor-toolbar" style="display:none;">
          <button id="pdf-editor-add">+ Add New Text</button>
          <button id="pdf-editor-rotate">⟳ Rotate Page</button>
          <button id="pdf-editor-delete" class="pdf-danger">✕ Delete This Page</button>
          <span class="pdf-editor__hint">Click a text line to edit it. Use “Add New Text” for blank areas.</span>
        </div>

        <div class="pdf-editor__nav" id="pdf-editor-nav" style="display:none;">
          <button id="pdf-editor-prev">← Back</button>
          <span class="pdf-editor__hint" id="pdf-editor-page">Page 1 / 1</span>
          <button id="pdf-editor-next">Next →</button>
        </div>

        <div class="pdf-editor__status" id="pdf-editor-status"></div>
        <div class="pdf-editor__empty" id="pdf-editor-empty">Choose one PDF file to start editing.</div>

        <div class="pdf-editor__viewer" id="pdf-editor-viewer" style="display:none;">
          <div class="pdf-editor__stack" id="pdf-editor-stack">
            <canvas class="pdf-editor__canvas" id="pdf-editor-canvas"></canvas>
            <div class="pdf-editor__textlayer" id="pdf-editor-textlayer"></div>
          </div>
        </div>
      </div>
    `;

    const $ = (selector) => container.querySelector(selector);
    const fileInput = $('#pdf-editor-file');
    const empty = $('#pdf-editor-empty');
    const viewer = $('#pdf-editor-viewer');
    const toolbar = $('#pdf-editor-toolbar');
    const nav = $('#pdf-editor-nav');
    const downloadBtn = $('#pdf-editor-download');
    const statusEl = $('#pdf-editor-status');
    const canvas = $('#pdf-editor-canvas');
    const textLayer = $('#pdf-editor-textlayer');
    const pageStack = $('#pdf-editor-stack');
    const pageIndicator = $('#pdf-editor-page');
    const prevBtn = $('#pdf-editor-prev');
    const nextBtn = $('#pdf-editor-next');
    const rotateBtn = $('#pdf-editor-rotate');
    const deletePageBtn = $('#pdf-editor-delete');
    const addTextBtn = $('#pdf-editor-add');

    const SCALE = 1.6;
    let originalBytes = null;
    let pdfDoc = null;
    let numPages = 0;
    let currentPage = 1;
    let pageState = {};
    let itemsCache = {};
    let addTextHandler = null;

    function setStatus(message) {
      statusEl.textContent = message || '';
    }

    function ensureState(n) {
      if (!pageState[n]) {
        pageState[n] = { rotation: 0, deleted: false, edits: {}, added: [] };
      }
      return pageState[n];
    }

    async function renderPage(n) {
      const state = ensureState(n);
      const page = await pdfDoc.getPage(n);
      const viewport = page.getViewport({ scale: SCALE, rotation: state.rotation });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      pageStack.style.width = viewport.width + 'px';
      pageStack.style.height = viewport.height + 'px';

      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      textLayer.innerHTML = '';
      textLayer.style.width = viewport.width + 'px';
      textLayer.style.height = viewport.height + 'px';

      const textContent = await page.getTextContent();
      itemsCache[n] = textContent.items;

      const boxes = textContent.items.map((item) => {
        if (!item.str || !item.str.trim()) return null;
        const tx = window.pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontHeight = Math.hypot(tx[2], tx[3]);
        const scaleX = Math.hypot(tx[0], tx[1]);
        const width = item.width * scaleX;
        const left = tx[4];
        const top = tx[5] - fontHeight;
        return { left, top, width, fontHeight };
      });

      boxes.forEach((b) => {
        if (!b) return;
        ctx.fillStyle = '#fff';
        ctx.fillRect(b.left - 1, b.top - 1, b.width + 2, b.fontHeight * 1.3 + 2);
      });

      textContent.items.forEach((item, idx) => {
        const b = boxes[idx];
        if (!b) return;
        const span = document.createElement('div');
        span.className = 'pdf-editor__tspan';
        span.contentEditable = 'true';
        span.spellcheck = false;
        span.textContent = state.edits[idx] !== undefined ? state.edits[idx] : item.str;
        if (state.edits[idx] !== undefined) span.classList.add('edited');
        span.style.left = b.left + 'px';
        span.style.top = b.top + 'px';
        span.style.minWidth = b.width + 'px';
        span.style.fontSize = b.fontHeight + 'px';
        span.style.lineHeight = b.fontHeight + 'px';
        span.dataset.idx = idx;

        span.addEventListener('input', () => {
          const value = span.textContent;
          if (value === item.str) {
            delete state.edits[idx];
            span.classList.remove('edited');
          } else {
            state.edits[idx] = value;
            span.classList.add('edited');
          }
        });

        span.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            span.blur();
          }
        });

        textLayer.appendChild(span);
      });

      pageIndicator.textContent =
        `Page ${n} / ${numPages}` + (state.deleted ? ' (marked for deletion)' : '');
      prevBtn.disabled = n <= 1;
      nextBtn.disabled = n >= numPages;
      deletePageBtn.textContent = state.deleted ? '↺ Undo Page Delete' : '✕ Delete This Page';
    }

    async function handleFile(e) {
      const file = e.target.files[0];
      if (!file) return;

      setStatus('PDF load ho raha hai...');
      try {
        originalBytes = await file.arrayBuffer();
        pdfDoc = await window.pdfjsLib.getDocument({ data: originalBytes.slice(0) }).promise;
        numPages = pdfDoc.numPages;
        pageState = {};
        itemsCache = {};
        currentPage = 1;

        empty.style.display = 'none';
        viewer.style.display = 'flex';
        toolbar.style.display = 'flex';
        nav.style.display = 'flex';
        downloadBtn.disabled = false;

        await renderPage(currentPage);
        setStatus(`${numPages} page(s) load ho gaye.`);
      } catch (err) {
        setStatus('Error: PDF load nahi hui — ' + err.message);
      } finally {
        fileInput.value = '';
      }
    }

    async function downloadEditedPdf() {
      if (!originalBytes) return;
      setStatus('Final PDF ban raha hai...');

      try {
        const srcDoc = await window.PDFLib.PDFDocument.load(originalBytes.slice(0));
        const finalDoc = await window.PDFLib.PDFDocument.create();
        const font = await finalDoc.embedFont(window.PDFLib.StandardFonts.Helvetica);

        for (let n = 1; n <= numPages; n++) {
          const state = ensureState(n);
          if (state.deleted) continue;

          const [copied] = await finalDoc.copyPages(srcDoc, [n - 1]);
          copied.setRotation(window.PDFLib.degrees(state.rotation));
          finalDoc.addPage(copied);

          const { height: pageHeight } = copied.getSize();
          const items = itemsCache[n] || [];

          for (const [idxStr, newText] of Object.entries(state.edits)) {
            const item = items[parseInt(idxStr, 10)];
            if (!item) continue;

            const x = item.transform[4];
            const y = item.transform[5];
            const fontSize = Math.hypot(item.transform[2], item.transform[3]) || 12;
            const w = item.width || (newText.length * fontSize * 0.55);

            copied.drawRectangle({
              x: x - 1,
              y: y - fontSize * 0.25,
              width: Math.max(w, newText.length * fontSize * 0.5) + 2,
              height: fontSize * 1.15,
              color: window.PDFLib.rgb(1, 1, 1),
            });

            copied.drawText(newText, {
              x, y, size: fontSize, font,
              color: window.PDFLib.rgb(0, 0, 0),
            });
          }

          for (const added of state.added) {
            const pdfX = added.x / SCALE;
            const pdfY = pageHeight - (added.y / SCALE) - added.size;
            copied.drawText(added.text, {
              x: pdfX, y: pdfY, size: added.size, font,
              color: window.PDFLib.rgb(0, 0, 0),
            });
          }
        }

        const outBytes = await finalDoc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        context.downloadFile(blob, 'edited.pdf');
        setStatus('Edited PDF download ho gaya.');
      } catch (err) {
        setStatus('Error banate waqt: ' + err.message);
      }
    }

    function handleAddText() {
      setStatus('Page par kahin bhi click karo naya text daalne ke liye.');

      if (addTextHandler) pageStack.removeEventListener('click', addTextHandler);

      addTextHandler = (e) => {
        if (e.target.closest('.pdf-editor__tspan')) {
          pageStack.removeEventListener('click', addTextHandler);
          addTextHandler = null;
          return;
        }

        const rect = pageStack.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const box = document.createElement('div');
        box.className = 'pdf-editor__newbox';
        box.contentEditable = 'true';
        box.spellcheck = false;
        box.style.left = x + 'px';
        box.style.top = y + 'px';
        box.textContent = 'New text';
        textLayer.appendChild(box);
        box.focus();

        const range = document.createRange();
        range.selectNodeContents(box);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        box.addEventListener('blur', () => {
          const value = box.textContent.trim();
          box.remove();
          if (!value || value === 'New text') return;

          const state = ensureState(currentPage);
          state.added.push({ x, y, size: 16, text: value });
          renderPage(currentPage);
          setStatus('Naya text add ho gaya.');
        });

        pageStack.removeEventListener('click', addTextHandler);
        addTextHandler = null;
      };

      pageStack.addEventListener('click', addTextHandler);
    }

    function handlePrev() {
      if (currentPage > 1) {
        currentPage -= 1;
        renderPage(currentPage);
      }
    }

    function handleNext() {
      if (currentPage < numPages) {
        currentPage += 1;
        renderPage(currentPage);
      }
    }

    function handleRotate() {
      const state = ensureState(currentPage);
      state.rotation = (state.rotation + 90) % 360;
      renderPage(currentPage);
    }

    function handleDeletePage() {
      const state = ensureState(currentPage);
      state.deleted = !state.deleted;
      renderPage(currentPage);
    }

    fileInput.addEventListener('change', handleFile);
    downloadBtn.addEventListener('click', downloadEditedPdf);
    prevBtn.addEventListener('click', handlePrev);
    nextBtn.addEventListener('click', handleNext);
    rotateBtn.addEventListener('click', handleRotate);
    deletePageBtn.addEventListener('click', handleDeletePage);
    addTextBtn.addEventListener('click', handleAddText);

    return () => {
      fileInput.removeEventListener('change', handleFile);
      downloadBtn.removeEventListener('click', downloadEditedPdf);
      prevBtn.removeEventListener('click', handlePrev);
      nextBtn.removeEventListener('click', handleNext);
      rotateBtn.removeEventListener('click', handleRotate);
      deletePageBtn.removeEventListener('click', handleDeletePage);
      addTextBtn.removeEventListener('click', handleAddText);
      if (addTextHandler) pageStack.removeEventListener('click', addTextHandler);
      textLayer.innerHTML = '';
      originalBytes = null;
      pdfDoc = null;
    };
  },
};

async function loadDependencies() {
  await Promise.all([
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
      () => typeof window.PDFLib !== 'undefined'
    ),
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      () => typeof window.pdfjsLib !== 'undefined'
    ),
  ]);

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function loadScript(url, globalCheck) {
  if (globalCheck && globalCheck()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load dependency: ${url}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load dependency: ${url}`));
    document.head.appendChild(script);
  });
}

export default PdfEditor;
