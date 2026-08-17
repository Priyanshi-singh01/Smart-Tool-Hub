/**
 * file-compressor.js
 * Smart File Compressor tool module for Smart Tools Hub.
 * Compresses images (JPG/PNG/WebP) and PDFs client-side to a target file
 * size using binary-search quality/resolution search, with a scanned-PDF
 * "rasterize" mode for image-only PDFs that have no structural bloat to
 * strip. Everything runs in the browser; files are never uploaded.
 */
export const FileCompressor = {
  id: 'file-compressor',

  async mount(container, context) {
    await loadDependencies();

    container.innerHTML = `
      <style>
.sfc{
    --bg:#F6F6F3;
    --surface:#FFFFFF;
    --ink:#15181D;
    --muted:#6B7178;
    --faint:#9A9EA5;
    --line:#E4E3DE;
    --line-strong:#D2D1CB;
    --accent:#2F5FE0;
    --accent-ink:#1B3B9C;
    --accent-soft:#EAEFFC;
    --success:#177A50;
    --success-soft:#E7F5EE;
    --warn:#9A5B0A;
    --warn-soft:#FBF1DF;
    --danger:#B23A34;
    --danger-soft:#FBEAE9;
    --mono: ui-monospace, "SF Mono", SFMono-Regular, Consolas, "Liberation Mono", monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --radius: 16px;
    --radius-sm: 10px;
  }.sfc *{box-sizing:border-box;}.sfc{
    display:block;
    background:
      linear-gradient(var(--line) 1px, transparent 1px) 0 0/100% 28px,
      var(--bg);
    color:var(--ink);
    font-family:var(--sans);
    -webkit-font-smoothing:antialiased;
    border-radius:14px;
    padding:1px;
  }.sfc .wrap{max-width:920px;margin:0 auto;padding:48px 20px 100px;}
  @media (max-width:640px){.sfc .wrap{padding:28px 14px 80px;} }.sfc header.hero{margin-bottom:36px;}.sfc .eyebrow{
    display:inline-flex;align-items:center;gap:8px;
    font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--accent-ink);background:var(--accent-soft);
    padding:5px 10px;border-radius:100px;margin-bottom:16px;
  }.sfc .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--accent);}.sfc h1{
    font-size:clamp(30px,5vw,44px);
    line-height:1.05;letter-spacing:-0.02em;
    margin:0 0 12px;font-weight:650;
  }.sfc .sub{color:var(--muted);font-size:16px;line-height:1.5;max-width:520px;margin:0;}.sfc .privacy-line{
    display:flex;align-items:center;gap:8px;margin-top:18px;
    font-family:var(--mono);font-size:12px;color:var(--muted);
  }.sfc .privacy-line svg{flex-shrink:0;}.sfc .card{
    background:var(--surface);
    border:1px solid var(--line);
    border-radius:var(--radius);
    padding:22px;
  }.sfc .card + .card{margin-top:16px;}.sfc /* Dropzone */
  .dropzone{
    border:1.5px dashed var(--line-strong);
    border-radius:var(--radius);
    background:var(--surface);
    padding:56px 24px;
    text-align:center;
    cursor:pointer;
    transition:border-color .15s ease, background .15s ease, transform .1s ease;
    position:relative;
  }.sfc .dropzone:hover{border-color:var(--accent);}.sfc .dropzone.drag{border-color:var(--accent);background:var(--accent-soft);transform:scale(0.996);}.sfc .dz-icon{
    width:52px;height:52px;margin:0 auto 18px;
    border-radius:50%;background:var(--accent-soft);
    display:flex;align-items:center;justify-content:center;color:var(--accent-ink);
  }.sfc .dz-title{font-size:17px;font-weight:600;margin:0 0 4px;}.sfc .dz-sub{color:var(--muted);font-size:14px;margin:0 0 18px;}.sfc .browse-btn{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--ink);color:#fff;border:none;
    padding:10px 18px;border-radius:100px;font-size:14px;font-weight:600;
    cursor:pointer;
  }.sfc .browse-btn:hover{background:#2b2f36;}.sfc .dz-types{
    font-family:var(--mono);font-size:11px;letter-spacing:.05em;
    color:var(--faint);margin-top:20px;text-transform:uppercase;
  }.sfc input[type=file]{display:none;}.sfc /* File card */
  .file-card{margin-top:16px;}.sfc .file-head{display:flex;gap:14px;align-items:flex-start;}.sfc .thumb{
    width:64px;height:64px;border-radius:10px;flex-shrink:0;
    background:var(--bg);border:1px solid var(--line);
    display:flex;align-items:center;justify-content:center;overflow:hidden;
  }.sfc .thumb img{width:100%;height:100%;object-fit:cover;}.sfc .file-meta{flex:1;min-width:0;}.sfc .file-name{font-weight:600;font-size:15px;margin:0 0 3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.sfc .file-tags{display:flex;gap:8px;align-items:center;font-family:var(--mono);font-size:11px;color:var(--muted);}.sfc .badge{
    background:var(--bg);border:1px solid var(--line);
    padding:2px 8px;border-radius:100px;text-transform:uppercase;letter-spacing:.04em;
  }.sfc .remove-btn{
    background:none;border:none;color:var(--faint);cursor:pointer;
    font-size:18px;line-height:1;padding:6px;border-radius:8px;flex-shrink:0;
  }.sfc .remove-btn:hover{color:var(--danger);background:var(--danger-soft);}.sfc .section-label{
    font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--muted);margin:20px 0 10px;
  }.sfc .pill-row{display:flex;flex-wrap:wrap;gap:8px;}.sfc .pill{
    border:1px solid var(--line);background:var(--surface);
    padding:8px 14px;border-radius:100px;font-size:13px;font-family:var(--mono);
    cursor:pointer;color:var(--ink);
  }.sfc .pill:hover{border-color:var(--accent);}.sfc .pill.active{background:var(--ink);border-color:var(--ink);color:#fff;}.sfc .custom-size{display:flex;align-items:center;gap:8px;margin-top:10px;}.sfc .custom-size input[type=number]{
    width:90px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;
    font-family:var(--mono);font-size:13px;
  }.sfc .custom-size select{
    padding:8px 10px;border:1px solid var(--line);border-radius:8px;
    font-family:var(--mono);font-size:13px;background:var(--surface);
  }.sfc .custom-size button{
    padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:var(--surface);
    font-size:13px;cursor:pointer;
  }.sfc .custom-size button:hover{border-color:var(--accent);}.sfc .mode-row{display:flex;gap:8px;}.sfc .mode-btn{
    flex:1;border:1px solid var(--line);background:var(--surface);
    padding:12px 10px;border-radius:10px;cursor:pointer;text-align:left;
  }.sfc .mode-btn strong{display:block;font-size:13px;margin-bottom:2px;}.sfc .mode-btn span{display:block;font-size:11px;color:var(--muted);}.sfc .mode-btn.active{border-color:var(--accent);background:var(--accent-soft);}
  @media (max-width:520px){.sfc .mode-row{flex-direction:column;} }.sfc .webp-opt{
    display:flex;align-items:center;gap:8px;margin-top:12px;
    font-size:12px;color:var(--muted);font-family:var(--mono);
  }.sfc .compress-btn{
    margin-top:18px;width:100%;padding:13px;border:none;border-radius:10px;
    background:var(--accent);color:#fff;font-size:14px;font-weight:650;
    cursor:pointer;letter-spacing:.01em;
  }.sfc .compress-btn:hover{background:var(--accent-ink);}.sfc .compress-btn:disabled{background:var(--line-strong);color:var(--faint);cursor:not-allowed;}.sfc /* progress / log */
  .progress-wrap{margin-top:16px;}.sfc .progress-msg{
    font-size:13px;color:var(--ink);font-weight:600;margin-bottom:8px;
    display:flex;align-items:center;gap:8px;
  }.sfc .spinner{
    width:13px;height:13px;border-radius:50%;
    border:2px solid var(--line-strong);border-top-color:var(--accent);
    animation:sfcSpin .7s linear infinite;flex-shrink:0;
  }
  @keyframes sfcSpin{to{transform:rotate(360deg);}}.sfc .log{
    background:#101317;color:#B7D0FF;font-family:var(--mono);font-size:12px;
    border-radius:10px;padding:12px 14px;max-height:150px;overflow-y:auto;
    line-height:1.7;
  }.sfc .log .l-line{opacity:.55;}.sfc .log .l-line:last-child{opacity:1;color:#fff;}.sfc /* result */
  .result{margin-top:18px;}.sfc .result-head{display:flex;align-items:center;gap:8px;margin-bottom:14px;}.sfc .result-head .check{color:var(--success);}.sfc .result-head strong{font-size:15px;}.sfc .warn-banner{
    background:var(--warn-soft);color:var(--warn);border-radius:10px;
    padding:10px 12px;font-size:13px;margin-bottom:14px;line-height:1.5;
  }.sfc .error-banner{
    background:var(--danger-soft);color:var(--danger);border-radius:10px;
    padding:12px 14px;font-size:13px;line-height:1.5;
  }.sfc .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
  @media (max-width:560px){.sfc .stat-grid{grid-template-columns:repeat(2,1fr);} }.sfc .stat{background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;}.sfc .stat .k{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:4px;}.sfc .stat .v{font-family:var(--mono);font-size:16px;font-weight:600;}.sfc .stat.reduction .v{color:var(--success);}.sfc .ruler{position:relative;height:34px;margin-bottom:6px;}.sfc .ruler-track{
    position:absolute;left:0;top:14px;height:6px;width:100%;
    background:var(--line);border-radius:100px;overflow:hidden;
  }.sfc .ruler-fill{
    position:absolute;left:0;top:14px;height:6px;border-radius:100px;
    background:linear-gradient(90deg,var(--accent),var(--success));
    transition:width .5s ease;
  }.sfc .ruler-labels{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--muted);margin-bottom:16px;}.sfc .compare-wrap{margin:16px 0;}.sfc .compare{
    position:relative;width:100%;aspect-ratio:16/10;border-radius:10px;overflow:hidden;
    border:1px solid var(--line);background:var(--bg);
  }.sfc .compare img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:var(--bg);}.sfc .compare .after-clip{position:absolute;top:0;left:0;width:50%;height:100%;overflow:hidden;}.sfc .compare .after-clip img{width:200%;max-width:none;}.sfc .compare .after-clip{width:50%;}.sfc .slider-handle{
    position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;
    box-shadow:0 0 0 1px rgba(0,0,0,.15);cursor:ew-resize;
  }.sfc .slider-handle::after{
    content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:32px;height:32px;border-radius:50%;background:#fff;
    box-shadow:0 2px 8px rgba(0,0,0,.25);
  }.sfc .compare-tags{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:6px;}.sfc .btn-row{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;}.sfc .btn-primary, .sfc .btn-secondary{
    flex:1;min-width:160px;padding:12px;border-radius:10px;font-size:14px;font-weight:600;
    cursor:pointer;text-align:center;border:none;
  }.sfc .btn-primary{background:var(--ink);color:#fff;}.sfc .btn-primary:hover{background:#2b2f36;}.sfc .btn-secondary{background:var(--surface);border:1px solid var(--line);color:var(--ink);}.sfc .btn-secondary:hover{border-color:var(--accent);}.sfc .footer-actions{
    display:flex;justify-content:space-between;align-items:center;
    margin-top:22px;padding-top:18px;border-top:1px solid var(--line);
    flex-wrap:wrap;gap:12px;
  }.sfc .add-more{
    font-family:var(--mono);font-size:12px;color:var(--accent-ink);
    background:none;border:none;cursor:pointer;text-decoration:underline;
  }.sfc .download-all{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--success);color:#fff;border:none;
    padding:10px 16px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;
  }.sfc .download-all:hover{background:#106140;}.sfc .download-all:disabled{background:var(--line-strong);color:var(--faint);cursor:not-allowed;}.sfc .empty-hint{color:var(--faint);font-size:12px;font-family:var(--mono);text-align:center;margin-top:14px;}
      </style>
      <div class="sfc">
<div class="wrap">

  <header class="hero">
    <div class="eyebrow"><span class="dot"></span>Runs entirely in your browser</div>
    <h1>Smart File Compressor</h1>
    <p class="sub">Compress your files to your desired size with the best possible quality.</p>
    <div class="privacy-line">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5l-8-3Z"/></svg>
      Your files are processed locally in your browser and are not uploaded to a server.
    </div>
  </header>

  <div id="dropzoneCard" class="card" style="padding:0;border:none;background:none;">
    <div class="dropzone" id="dropzone">
      <div class="dz-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M12 4 7 9M12 4l5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
      </div>
      <p class="dz-title">Drop your file here</p>
      <p class="dz-sub">or</p>
      <button class="browse-btn" id="browseBtn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        Browse Files
      </button>
      <input type="file" id="fileInput" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" />
      <div class="dz-types">JPG &nbsp;&bull;&nbsp; JPEG &nbsp;&bull;&nbsp; PNG &nbsp;&bull;&nbsp; WebP &nbsp;&bull;&nbsp; PDF</div>
    </div>
  </div>

  <div id="filesContainer"></div>

  <div id="bulkActions"></div>

</div>
      </div>
    `;


    /* ============================= STATE ============================= */
    let files = []; // { id, file, kind, status, error, previewURL, targetBytes, targetPreset, mode, allowWebp,
                     //   log:[], compressedBlob, compressedURL, achievedQuality, targetUnreachable }
    let idCounter = 0;

    const MODES = {
      max:      { label:'Maximum Compression', sub:'Smallest possible file size', floor:0.04, hi:0.9 },
      balanced: { label:'Balanced', sub:'Best balance of quality and size', floor:0.22, hi:0.93 },
      best:     { label:'Best Quality', sub:'Prioritize quality, reduce size gently', floor:0.5, hi:0.97 },
    };

    const PRESETS = [
      {label:'50 KB', bytes:50*1024},
      {label:'100 KB', bytes:100*1024},
      {label:'200 KB', bytes:200*1024},
      {label:'500 KB', bytes:500*1024},
      {label:'1 MB', bytes:1024*1024},
    ];

    const MAX_FILE_BYTES = 60*1024*1024; // 60MB browser-safety ceiling

    /* ============================= HELPERS ============================= */
    function formatSize(bytes){
      if(bytes < 1024) return bytes + ' B';
      if(bytes < 1024*1024) return (bytes/1024).toFixed(bytes/1024 < 10 ? 1 : 0) + ' KB';
      if(bytes < 1024*1024*1024) return (bytes/(1024*1024)).toFixed(2) + ' MB';
      return (bytes/(1024*1024*1024)).toFixed(2) + ' GB';
    }
    function extOf(name){ return (name.split('.').pop()||'').toLowerCase(); }
    function kindOf(file){
      if(['image/jpeg','image/png','image/webp'].includes(file.type)) return 'image';
      if(file.type === 'application/pdf') return 'pdf';
      const e = extOf(file.name);
      if(['jpg','jpeg','png','webp'].includes(e)) return 'image';
      if(e === 'pdf') return 'pdf';
      return null;
    }
    function uid(){ return 'f' + (idCounter++); }
    function $(sel, scope=container){ return scope.querySelector(sel); }
    function $all(sel, scope=container){ return [...scope.querySelectorAll(sel)]; }

    /* ============================= FILE INTAKE ============================= */
    const dropzone = $('#dropzone');
    const fileInput = $('#fileInput');
    const browseBtn = $('#browseBtn');

    function onBrowseClick(e) { e.stopPropagation(); fileInput.click(); }
    function onDropzoneClick() { fileInput.click(); }
    function onFileInputChange(e) { handleIncoming(e.target.files); }
    function onDragEnter(e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag'); }
    function onDragLeave(e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag'); }
    function onDrop(e) { handleIncoming(e.dataTransfer.files); }
    function onWindowDragOver(e) { e.preventDefault(); }
    function onWindowDrop(e) { e.preventDefault(); }

    browseBtn.addEventListener('click', onBrowseClick);
    dropzone.addEventListener('click', onDropzoneClick);
    fileInput.addEventListener('change', onFileInputChange);
    ['dragenter', 'dragover'].forEach((evt) => dropzone.addEventListener(evt, onDragEnter));
    ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, onDragLeave));
    dropzone.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('drop', onWindowDrop);

    function handleIncoming(fileList){
      [...fileList].forEach(file => {
        const kind = kindOf(file);
        const entry = {
          id: uid(), file, kind,
          status: kind ? (file.size > MAX_FILE_BYTES ? 'error' : 'idle') : 'error',
          error: !kind ? 'This file format is not supported.'
                 : (file.size > MAX_FILE_BYTES ? 'This file is too large to process efficiently in your browser.' : null),
          previewURL: kind === 'image' ? URL.createObjectURL(file) : null,
          targetBytes: null, targetPreset: null, customValue:'', customUnit:'KB',
          mode: 'balanced', allowWebp: false,
          log: [], compressedBlob: null, compressedURL: null, achievedQuality:null, targetUnreachable:false,
          dims: null,
          aggressivePdf: false, scanDetecting: kind === 'pdf', scanDetected: null, pageCount: null,
        };
        files.push(entry);
        if (kind === 'pdf') detectScannedPDF(entry);
      });
      fileInput.value = '';
      render();
    }

    /* Peek at a PDF's text layer to guess whether it's a scanned document (no real text)
       vs a text-based document. Used only to pre-select a sensible default — user can
       always override the checkbox themselves. */
    async function detectScannedPDF(entry){
      try {
        const buf = await entry.file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
        entry.pageCount = pdf.numPages;
        let totalChars = 0;
        const pagesToCheck = Math.min(pdf.numPages, 3);
        for (let i = 1; i <= pagesToCheck; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          totalChars += content.items.reduce((sum, it) => sum + (it.str ? it.str.length : 0), 0);
        }
        const avgCharsPerPage = totalChars / pagesToCheck;
        entry.scanDetected = avgCharsPerPage < 25; // near-empty text layer = almost certainly a scan/photo
        entry.aggressivePdf = entry.scanDetected;
      } catch (e) {
        entry.scanDetected = null; // couldn't tell — leave it to the user, don't guess
      } finally {
        entry.scanDetecting = false;
        render();
      }
    }

    function removeFile(id){
      const idx = files.findIndex(f => f.id === id);
      if(idx > -1){
        const f = files[idx];
        if(f.previewURL) URL.revokeObjectURL(f.previewURL);
        if(f.compressedURL) URL.revokeObjectURL(f.compressedURL);
        files.splice(idx,1);
      }
      render();
    }

    /* ============================= IMAGE COMPRESSION ============================= */
    function loadImage(file){
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({img, url});
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode-failed')); };
        img.src = url;
      });
    }
    function canvasToBlob(canvas, mime, quality){
      return new Promise(resolve => canvas.toBlob(resolve, mime, quality));
    }
    function drawScaled(img, scale){
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      return canvas;
    }

    async function binarySearchQuality(canvas, mime, targetBytes, floor, hi, log){
      let lo = floor, top = hi, best = null, bestQ = top, bestDiff = Infinity;
      for(let i=0; i<7; i++){
        const q = (lo + top) / 2;
        const blob = await canvasToBlob(canvas, mime, q);
        log(`Quality ${Math.round(q*100)} → ${formatSize(blob.size)}`);
        const diff = Math.abs(blob.size - targetBytes);
        if(diff < bestDiff || (diff === bestDiff && blob.size <= targetBytes)){
          bestDiff = diff; best = blob; bestQ = q;
        }
        if(blob.size > targetBytes) top = q; else lo = q;
      }
      return { blob: best, quality: bestQ };
    }

    async function compressImage(entry, updateLog){
      const { file, targetBytes, mode, allowWebp } = entry;
      const modeCfg = MODES[mode];
      const { img, url } = await loadImage(file);
      entry.dims = { w: img.naturalWidth, h: img.naturalHeight };

      const isPng = file.type === 'image/png' || extOf(file.name) === 'png';
      let outMime = isPng ? 'image/png' : (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');
      if (isPng && allowWebp) outMime = 'image/webp';

      updateLog('Reading file...');
      let result = null;

      if (outMime === 'image/png') {
        // No quality lever for PNG — reduce via resolution scaling.
        const scales = [1, 0.85, 0.7, 0.55, 0.4, 0.28, 0.2, 0.14];
        let best = null;
        for (const s of scales) {
          const canvas = drawScaled(img, s);
          const blob = await canvasToBlob(canvas, 'image/png', undefined);
          updateLog(`Scale ${Math.round(s*100)}% → ${formatSize(blob.size)}`);
          best = { blob, quality: null, scale: s };
          if (blob.size <= targetBytes) break;
        }
        result = best;
        entry.targetUnreachable = result.blob.size > targetBytes * 1.15;
      } else {
        // JPEG / WebP: binary-search quality, then fall back to resizing if still over target.
        const scales = [1, 0.75, 0.5, 0.35];
        let best = null, bestDiff = Infinity;
        for (const s of scales) {
          const canvas = drawScaled(img, s);
          updateLog(s === 1 ? 'Compressing...' : `Resizing to ${Math.round(s*100)}% and re-checking...`);
          const { blob, quality } = await binarySearchQuality(canvas, outMime, targetBytes, modeCfg.floor, modeCfg.hi, updateLog);
          const diff = Math.abs(blob.size - targetBytes);
          if (diff < bestDiff) { bestDiff = diff; best = { blob, quality, scale: s }; }
          if (blob.size <= targetBytes * 1.05) break;
        }
        result = best;
        entry.targetUnreachable = result.blob.size > targetBytes * 1.15;
      }

      URL.revokeObjectURL(url);
      entry.achievedQuality = result.quality;
      entry.outMime = outMime;
      return result.blob;
    }

    /* ============================= PDF COMPRESSION ============================= */
    async function compressPDF(entry, updateLog){
      const { file } = entry;
      updateLog('Reading file...');
      let bytes;
      try {
        bytes = await file.arrayBuffer();
      } catch(e){ throw new Error('corrupted'); }

      let pdfDoc;
      try {
        pdfDoc = await window.PDFLib.PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
      } catch(e){
        throw new Error('corrupted');
      }

      updateLog('Stripping unnecessary metadata...');
      try {
        pdfDoc.setTitle(''); pdfDoc.setAuthor(''); pdfDoc.setSubject('');
        pdfDoc.setKeywords([]); pdfDoc.setProducer('Smart File Compressor');
        pdfDoc.setCreator(''); pdfDoc.setLanguage('');
      } catch(e) { /* some fields may not exist — non-fatal */ }

      updateLog('Optimizing PDF structure (object streams)...');
      let outBytes;
      try {
        outBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage:false });
      } catch(e){
        throw new Error('compression-failed');
      }

      const blob = new Blob([outBytes], { type: 'application/pdf' });
      entry.targetUnreachable = blob.size > entry.targetBytes * 1.15;
      return blob;
    }

    /* ============================= PDF — AGGRESSIVE (RASTERIZE) MODE =============================
       For scanned documents / photo-of-a-document PDFs where the "size" is really just
       image data with a PDF wrapper. Renders each page to a canvas, then runs the SAME
       binary-search-on-JPEG-quality approach used for photos, across a few DPI scales,
       until the whole document lands near the target size. This trades away selectable
       text (pages become images) in exchange for the kind of real, large reduction that
       pdf-lib's structural-only pass can't deliver on files that have no bloat to strip. */
    async function compressPDFAggressive(entry, updateLog){
      const { file, targetBytes, mode } = entry;
      const modeCfg = MODES[mode];
      updateLog('Reading file...');
      const buf = await file.arrayBuffer();
      let pdf;
      try {
        pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      } catch (e) {
        throw new Error('corrupted');
      }
      const numPages = pdf.numPages;
      if (numPages > 40) throw new Error('too-many-pages');

      updateLog(`Rendering ${numPages} page${numPages > 1 ? 's' : ''}...`);

      // Capture true page size (points, scale=1) once — this stays fixed regardless of
      // the raster resolution we choose below, so the output page dimensions never change.
      const pagePointSizes = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const vp1 = page.getViewport({ scale: 1 });
        pagePointSizes.push({ w: vp1.width, h: vp1.height });
      }

      const renderScales = [2.2, 1.7, 1.3, 1.0, 0.75];
      let chosen = null;

      for (const renderScale of renderScales) {
        updateLog(`Rasterizing at ${renderScale}x resolution...`);
        const canvases = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(viewport.width));
          canvas.height = Math.max(1, Math.round(viewport.height));
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          canvases.push(canvas);
        }

        // Binary-search a single JPEG quality shared across all pages so the document
        // looks consistent, targeting the overall byte budget.
        let lo = modeCfg.floor, hi = modeCfg.hi, best = null, bestDiff = Infinity;
        for (let iter = 0; iter < 6; iter++) {
          const q = (lo + hi) / 2;
          const blobs = [];
          let total = 0;
          for (const canvas of canvases) {
            const blob = await canvasToBlob(canvas, 'image/jpeg', q);
            blobs.push(blob);
            total += blob.size;
          }
          updateLog(`Quality ${Math.round(q * 100)} → est. ${formatSize(total)} (${numPages} page${numPages > 1 ? 's' : ''})`);
          const diff = Math.abs(total - targetBytes);
          if (diff < bestDiff) { bestDiff = diff; best = { blobs, quality: q, total }; }
          if (total > targetBytes) hi = q; else lo = q;
        }

        if (!chosen || best.total < chosen.total) chosen = best;
        if (best.total <= targetBytes * 1.1) break; // close enough, stop dropping resolution further
      }

      updateLog('Rebuilding PDF from compressed pages...');
      const newPdf = await window.PDFLib.PDFDocument.create();
      for (let i = 0; i < numPages; i++) {
        const jpgBytes = new Uint8Array(await chosen.blobs[i].arrayBuffer());
        const jpgImage = await newPdf.embedJpg(jpgBytes);
        const { w, h } = pagePointSizes[i];
        const pdfPage = newPdf.addPage([w, h]);
        pdfPage.drawImage(jpgImage, { x: 0, y: 0, width: w, height: h });
      }
      const outBytes = await newPdf.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      entry.targetUnreachable = blob.size > targetBytes * 1.15;
      entry.outMime = 'application/pdf';
      return blob;
    }

    /* ============================= COMPRESSION ORCHESTRATION ============================= */
    async function compressEntry(entry){
      entry.status = 'compressing';
      entry.log = [];
      entry.error = null;
      entry.compressedBlob = null;
      if (entry.compressedURL) { URL.revokeObjectURL(entry.compressedURL); entry.compressedURL = null; }
      render();

      const updateLog = (msg) => { entry.log.push(msg); renderFileCard(entry); };

      try {
        updateLog('Preparing file...');
        await sleep(120);
        let blob;
        if (entry.kind === 'image') {
          blob = await compressImage(entry, updateLog);
        } else if (entry.aggressivePdf) {
          blob = await compressPDFAggressive(entry, updateLog);
        } else {
          blob = await compressPDF(entry, updateLog);
        }
        updateLog('Checking target size...');
        await sleep(80);
        updateLog('Finalizing...');
        await sleep(80);

        entry.compressedBlob = blob;
        entry.compressedURL = URL.createObjectURL(blob);
        entry.status = 'done';
        updateLog('Compression Complete ✓');
      } catch(err){
        entry.status = 'error';
        if (err.message === 'corrupted') entry.error = 'This file appears to be corrupted or unreadable.';
        else if (err.message === 'decode-failed') entry.error = 'This file appears to be corrupted or unreadable.';
        else if (err.message === 'too-many-pages') entry.error = 'This PDF has too many pages to compress efficiently in your browser.';
        else entry.error = 'Unable to compress this file. Please try another file.';
      }
      render();
    }

    function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

    /* ============================= DOWNLOAD ============================= */
    function downloadEntry(entry){
      if (!entry.compressedBlob) return;
      const a = document.createElement('a');
      const ext = entry.outMime === 'image/webp' ? 'webp' : entry.outMime === 'image/png' ? 'png' :
                  entry.outMime === 'image/jpeg' ? 'jpg' : (entry.kind === 'pdf' ? 'pdf' : extOf(entry.file.name));
      const base = entry.file.name.replace(/\.[^.]+$/, '');
      a.href = entry.compressedURL;
      a.download = `${base}-compressed.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
    }

    async function downloadAll(){
      const done = files.filter(f => f.status === 'done' && f.compressedBlob);
      if (!done.length) return;
      const zip = new window.JSZip();
      done.forEach(entry => {
        const ext = entry.outMime === 'image/webp' ? 'webp' : entry.outMime === 'image/png' ? 'png' :
                    entry.outMime === 'image/jpeg' ? 'jpg' : (entry.kind === 'pdf' ? 'pdf' : extOf(entry.file.name));
        const base = entry.file.name.replace(/\.[^.]+$/, '');
        zip.file(`${base}-compressed.${ext}`, entry.compressedBlob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'compressed-files.zip';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }

    /* ============================= TARGET SIZE ============================= */
    function setPreset(entry, preset){
      entry.targetPreset = preset.label;
      entry.targetBytes = preset.bytes;
      entry.customValue = '';
      render();
    }
    function applyCustom(entry){
      const val = parseFloat(entry.customValue);
      if (!val || val <= 0) return;
      const bytes = entry.customUnit === 'MB' ? val * 1024 * 1024 : val * 1024;
      entry.targetBytes = Math.round(bytes);
      entry.targetPreset = null;
      render();
    }

    /* ============================= COMPARISON SLIDER ============================= */
    function initSlider(container){
      const handle = $('.slider-handle', container);
      const afterClip = $('.after-clip', container);
      let dragging = false;
      const move = (clientX) => {
        const rect = container.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(2, Math.min(98, pct));
        handle.style.left = pct + '%';
        afterClip.style.width = pct + '%';
      };
      handle.addEventListener('pointerdown', (e) => { dragging = true; handle.setPointerCapture(e.pointerId); });
      handle.addEventListener('pointermove', (e) => { if(dragging) move(e.clientX); });
      handle.addEventListener('pointerup', () => dragging = false);
      container.addEventListener('click', (e) => { if(e.target === handle) return; move(e.clientX); });
    }

    /* ============================= RENDER ============================= */
    function render(){
      const container = $('#filesContainer');
      container.innerHTML = '';
      files.forEach(entry => {
        const card = buildFileCard(entry);
        container.appendChild(card);
      });

      const bulk = $('#bulkActions');
      bulk.innerHTML = '';
      if (files.length > 1) {
        const doneCount = files.filter(f => f.status === 'done').length;
        const div = document.createElement('div');
        div.className = 'card footer-actions';
        div.innerHTML = `
          <button class="add-more" id="addMoreBtn">+ Add another file</button>
          <button class="download-all" id="downloadAllBtn" ${doneCount ? '' : 'disabled'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download All (${doneCount}) as ZIP
          </button>`;
        bulk.appendChild(div);
        $('#addMoreBtn', div).addEventListener('click', () => fileInput.click());
        $('#downloadAllBtn', div).addEventListener('click', downloadAll);
      } else if (files.length === 1) {
        const div = document.createElement('div');
        div.className = 'empty-hint';
        div.textContent = '+ drop or browse to add another file';
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => fileInput.click());
        bulk.appendChild(div);
      }
    }

    function renderFileCard(entry){
      const old = container.querySelector('#card-' + entry.id);
      if (!old) return;
      const fresh = buildFileCard(entry);
      old.replaceWith(fresh);
    }

    function buildFileCard(entry){
      const card = document.createElement('div');
      card.className = 'card file-card';
      card.id = 'card-' + entry.id;

      const sizeStr = formatSize(entry.file.size);
      const typeLabel = entry.kind === 'image' ? extOf(entry.file.name).toUpperCase() || 'IMAGE' : 'PDF';

      const thumbInner = entry.kind === 'image'
        ? `<img src="${entry.previewURL}" alt="">`
        : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" color="var(--muted)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>`;

      card.innerHTML = `
        <div class="file-head">
          <div class="thumb">${thumbInner}</div>
          <div class="file-meta">
            <p class="file-name">${escapeHtml(entry.file.name)}</p>
            <div class="file-tags">
              <span class="badge">${typeLabel}</span>
              <span>Original Size: ${sizeStr}</span>
            </div>
          </div>
          <button class="remove-btn" title="Remove">✕</button>
        </div>
        <div class="body"></div>
      `;

      $('.remove-btn', card).addEventListener('click', () => removeFile(entry.id));

      const body = $('.body', card);

      if (entry.status === 'error' && !entry.targetBytes) {
        // pre-compression fatal error (unsupported / too large)
        const err = document.createElement('div');
        err.className = 'error-banner';
        err.style.marginTop = '16px';
        err.textContent = entry.error;
        body.appendChild(err);
        return card;
      }

      // Target size section
      if (entry.status === 'idle' || entry.status === 'error') {
        body.appendChild(buildTargetSection(entry));
        body.appendChild(buildModeSection(entry));
        if (entry.kind === 'image' && (entry.file.type === 'image/png' || extOf(entry.file.name) === 'png')) {
          body.appendChild(buildWebpToggle(entry));
        }
        if (entry.kind === 'pdf') {
          body.appendChild(buildPdfModeSection(entry));
        }
        const btn = document.createElement('button');
        btn.className = 'compress-btn';
        btn.textContent = entry.status === 'error' ? 'Try Compressing Again' : 'Compress File';
        btn.disabled = !entry.targetBytes;
        btn.addEventListener('click', () => compressEntry(entry));
        body.appendChild(btn);

        if (entry.status === 'error' && entry.error) {
          const err = document.createElement('div');
          err.className = 'error-banner';
          err.style.marginTop = '14px';
          err.textContent = entry.error;
          body.appendChild(err);
        }
      }

      if (entry.status === 'compressing') {
        body.appendChild(buildProgressSection(entry));
      }

      if (entry.status === 'done') {
        body.appendChild(buildResultSection(entry));
      }

      return card;
    }

    function buildTargetSection(entry){
      const wrap = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = 'Target Size';
      wrap.appendChild(label);

      const row = document.createElement('div');
      row.className = 'pill-row';
      PRESETS.forEach(p => {
        const pill = document.createElement('button');
        pill.className = 'pill' + (entry.targetPreset === p.label ? ' active' : '');
        pill.textContent = p.label;
        pill.addEventListener('click', () => setPreset(entry, p));
        row.appendChild(pill);
      });
      wrap.appendChild(row);

      const custom = document.createElement('div');
      custom.className = 'custom-size';
      custom.innerHTML = `
        <input type="number" min="1" placeholder="Custom" value="${entry.customValue}">
        <select>
          <option value="KB" ${entry.customUnit==='KB'?'selected':''}>KB</option>
          <option value="MB" ${entry.customUnit==='MB'?'selected':''}>MB</option>
        </select>
        <button type="button">Set</button>
      `;
      const [input, select, setBtn] = [$('input', custom), $('select', custom), $('button', custom)];
      input.addEventListener('input', e => entry.customValue = e.target.value);
      select.addEventListener('change', e => entry.customUnit = e.target.value);
      setBtn.addEventListener('click', () => applyCustom(entry));
      wrap.appendChild(custom);

      if (entry.targetBytes && !entry.targetPreset) {
        const note = document.createElement('div');
        note.style.cssText = 'font-family:var(--mono);font-size:12px;color:var(--accent-ink);margin-top:8px;';
        note.textContent = `Target set to ${formatSize(entry.targetBytes)}`;
        wrap.appendChild(note);
      }

      return wrap;
    }

    function buildModeSection(entry){
      const wrap = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = 'Compression Mode';
      wrap.appendChild(label);

      const row = document.createElement('div');
      row.className = 'mode-row';
      Object.entries(MODES).forEach(([key, cfg]) => {
        const btn = document.createElement('button');
        btn.className = 'mode-btn' + (entry.mode === key ? ' active' : '');
        btn.type = 'button';
        btn.innerHTML = `<strong>${cfg.label}</strong><span>${cfg.sub}</span>`;
        btn.addEventListener('click', () => { entry.mode = key; render(); });
        row.appendChild(btn);
      });
      wrap.appendChild(row);
      return wrap;
    }

    function buildPdfModeSection(entry){
      const wrap = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = 'PDF Compression Mode';
      wrap.appendChild(label);

      if (entry.scanDetecting) {
        const note = document.createElement('div');
        note.style.cssText = 'font-family:var(--mono);font-size:12px;color:var(--muted);margin-bottom:10px;';
        note.textContent = 'Checking document...';
        wrap.appendChild(note);
      } else if (entry.scanDetected === true) {
        const note = document.createElement('div');
        note.style.cssText = 'font-family:var(--mono);font-size:12px;color:var(--accent-ink);margin-bottom:10px;';
        note.textContent = 'This looks like a scanned/photo document with little or no selectable text — aggressive image compression selected automatically for the best size reduction.';
        wrap.appendChild(note);
      }

      const opt = document.createElement('label');
      opt.className = 'webp-opt';
      opt.style.alignItems = 'flex-start';
      opt.innerHTML = `<input type="checkbox" ${entry.aggressivePdf ? 'checked' : ''} style="margin-top:2px;">
        <span>Compress aggressively by converting pages to images (best for scanned documents, IDs, signatures, exam/government uploads). Text will no longer be selectable or searchable — for text-heavy documents like resumes or contracts, keep this off.</span>`;
      $('input', opt).addEventListener('change', e => entry.aggressivePdf = e.target.checked);
      wrap.appendChild(opt);
      return wrap;
    }

    function buildWebpToggle(entry){
      const wrap = document.createElement('label');
      wrap.className = 'webp-opt';
      wrap.innerHTML = `<input type="checkbox" ${entry.allowWebp ? 'checked' : ''}> Allow converting to WebP if it reaches the target size with better quality (PNG has no quality dial — without this, only resizing is used)`;
      $('input', wrap).addEventListener('change', e => entry.allowWebp = e.target.checked);
      return wrap;
    }

    function buildProgressSection(entry){
      const wrap = document.createElement('div');
      wrap.className = 'progress-wrap';
      const msg = document.createElement('div');
      msg.className = 'progress-msg';
      const last = entry.log[entry.log.length - 1] || 'Preparing file...';
      msg.innerHTML = `<span class="spinner"></span> ${last}`;
      wrap.appendChild(msg);

      const log = document.createElement('div');
      log.className = 'log';
      log.innerHTML = entry.log.map((l,i) => `<div class="l-line">${escapeHtml(l)}</div>`).join('');
      wrap.appendChild(log);
      requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
      return wrap;
    }

    function buildResultSection(entry){
      const wrap = document.createElement('div');
      wrap.className = 'result';

      const head = document.createElement('div');
      head.className = 'result-head';
      head.innerHTML = `<span class="check">✓</span><strong>Compression Complete</strong>`;
      wrap.appendChild(head);

      if (entry.targetUnreachable) {
        const warn = document.createElement('div');
        warn.className = 'warn-banner';
        if (entry.kind === 'image') {
          warn.textContent = `Target size could not be reached while maintaining acceptable quality. Requested ${formatSize(entry.targetBytes)}, best achievable was ${formatSize(entry.compressedBlob.size)}. We preserved the best possible quality.`;
          wrap.appendChild(warn);
        } else if (entry.aggressivePdf) {
          warn.textContent = `Target size could not be reached even with aggressive compression. Requested ${formatSize(entry.targetBytes)}, best achievable was ${formatSize(entry.compressedBlob.size)}. Try a slightly higher target, or Maximum Compression mode.`;
          wrap.appendChild(warn);
        } else {
          warn.innerHTML = `This PDF has little structural bloat to strip, so the size barely moved (requested ${formatSize(entry.targetBytes)}, got ${formatSize(entry.compressedBlob.size)}). If this document doesn't need selectable/searchable text — e.g. a scan, ID, or signature for a portal upload — aggressive image-based compression will get you much closer to target.`;
          wrap.appendChild(warn);
          const retryBtn = document.createElement('button');
          retryBtn.className = 'btn-secondary';
          retryBtn.style.marginBottom = '14px';
          retryBtn.style.width = '100%';
          retryBtn.textContent = 'Try Aggressive Compression Instead';
          retryBtn.addEventListener('click', () => { entry.aggressivePdf = true; compressEntry(entry); });
          wrap.appendChild(retryBtn);
        }
      }

      const orig = entry.file.size, comp = entry.compressedBlob.size;
      const saved = Math.max(0, orig - comp);
      const pct = orig > 0 ? Math.round((saved / orig) * 100) : 0;

      const grid = document.createElement('div');
      grid.className = 'stat-grid';
      grid.innerHTML = `
        <div class="stat"><div class="k">Original</div><div class="v">${formatSize(orig)}</div></div>
        <div class="stat"><div class="k">Compressed</div><div class="v">${formatSize(comp)}</div></div>
        <div class="stat"><div class="k">Saved</div><div class="v">${formatSize(saved)}</div></div>
        <div class="stat reduction"><div class="k">Reduction</div><div class="v">${pct}%</div></div>
      `;
      wrap.appendChild(grid);

      const ruler = document.createElement('div');
      const fillPct = orig > 0 ? Math.max(4, Math.round((comp/orig)*100)) : 100;
      ruler.innerHTML = `
        <div class="ruler">
          <div class="ruler-track"></div>
          <div class="ruler-fill" style="width:${fillPct}%"></div>
        </div>
        <div class="ruler-labels"><span>${formatSize(orig)}</span><span>${formatSize(comp)} — best quality at target size</span></div>
      `;
      wrap.appendChild(ruler);

      if (entry.kind === 'image') {
        const compareWrap = document.createElement('div');
        compareWrap.className = 'compare-wrap';
        compareWrap.innerHTML = `
          <div class="compare">
            <img src="${entry.previewURL}" alt="Original">
            <div class="after-clip"><img src="${entry.compressedURL}" alt="Compressed"></div>
            <div class="slider-handle"></div>
          </div>
          <div class="compare-tags"><span>Original</span><span>Compressed</span></div>
        `;
        wrap.appendChild(compareWrap);
        requestAnimationFrame(() => initSlider($('.compare', compareWrap)));
      }

      const btnRow = document.createElement('div');
      btnRow.className = 'btn-row';
      const dl = document.createElement('button');
      dl.className = 'btn-primary';
      dl.textContent = 'Download Compressed File';
      dl.addEventListener('click', () => downloadEntry(entry));
      const again = document.createElement('button');
      again.className = 'btn-secondary';
      again.textContent = 'Compress Another File';
      again.addEventListener('click', () => fileInput.click());
      btnRow.appendChild(dl); btnRow.appendChild(again);
      wrap.appendChild(btnRow);

      return wrap;
    }

    function escapeHtml(str){
      const d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }


    return () => {
      browseBtn.removeEventListener('click', onBrowseClick);
      dropzone.removeEventListener('click', onDropzoneClick);
      fileInput.removeEventListener('change', onFileInputChange);
      dropzone.removeEventListener('dragenter', onDragEnter);
      dropzone.removeEventListener('dragover', onDragEnter);
      dropzone.removeEventListener('dragleave', onDragLeave);
      dropzone.removeEventListener('drop', onDragLeave);
      dropzone.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('drop', onWindowDrop);
      files.forEach((f) => {
        if (f.previewURL) URL.revokeObjectURL(f.previewURL);
        if (f.compressedURL) URL.revokeObjectURL(f.compressedURL);
      });
      files = [];
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
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      () => typeof window.JSZip !== 'undefined'
    ),
    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      () => typeof window.pdfjsLib !== 'undefined'
    ),
  ]);
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
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

export default FileCompressor;
