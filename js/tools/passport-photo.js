/**
 * passport-photo.js
 * Passport Photo Maker tool module for Smart Tools Hub.
 * 3-step flow: crop (auto face-detect) -> remove background -> combine into
 * a printable sheet (PNG or PDF). Everything runs in the browser.
 *
 * External libraries (pdf-lib, face-api.js, @imgly/background-removal) are
 * lazy-loaded only when this tool is opened.
 */
export const PassportPhoto = {
  id: 'passport-photo',

  async mount(container, context) {
    await loadDependencies();

    container.innerHTML = `
      <style>
        .pp {
          --pp-bg:#F4F1EA; --pp-panel:#FFFFFF; --pp-ink:#1E1B16; --pp-muted:#7A7368;
          --pp-accent:#D97757; --pp-border:#DEDACD; --pp-danger:#B3432B; --pp-green:#4C8B5A;
          background:var(--pp-bg); color:var(--pp-ink); border:1px solid var(--pp-border);
          border-radius:14px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
        }
        .pp * { box-sizing:border-box; }
        .pp__header { padding:18px 22px; border-bottom:1px solid var(--pp-border); }
        .pp h3 { margin:0; font-size:19px; font-weight:650; }
        .pp__sub { font-size:12px; color:var(--pp-muted); margin-top:4px; }

        .pp__stepper { display:flex; gap:0; padding:14px 22px; border-bottom:1px solid var(--pp-border); background:var(--pp-panel); }
        .pp__tab { flex:1; text-align:center; padding:10px 8px; font-size:13px; font-weight:600; color:var(--pp-muted); border-bottom:3px solid var(--pp-border); }
        .pp__tab.active { color:var(--pp-accent); border-bottom-color:var(--pp-accent); }
        .pp__tab.done { color:var(--pp-green); }

        .pp__main { padding:22px; }
        .pp__screen { display:none; }
        .pp__screen.active { display:block; }
        .pp__layout { display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start; }
        .pp__panel { background:var(--pp-panel); border:1px solid var(--pp-border); border-radius:12px; padding:16px 18px; }
        .pp__sidebar { width:270px; flex-shrink:0; }
        .pp__sidebar h4 { font-size:14px; font-weight:600; margin:0 0 4px; }
        .pp__field { margin-bottom:14px; }
        .pp label { font-size:12px; color:var(--pp-muted); display:block; margin-bottom:5px; }
        .pp select, .pp input[type=number] { width:100%; padding:8px 10px; border:1px solid var(--pp-border); border-radius:7px; font-size:13px; background:#fff; color:var(--pp-ink); }
        .pp input[type=range] { width:100%; }
        .pp button { background:var(--pp-panel); border:1px solid var(--pp-border); color:var(--pp-ink); padding:9px 14px; border-radius:7px; font-size:13px; cursor:pointer; font-weight:500; width:100%; }
        .pp button:hover { border-color:var(--pp-accent); }
        .pp button:disabled { opacity:.4; cursor:not-allowed; }
        .pp button.pp-primary { background:var(--pp-accent); color:#fff; border-color:var(--pp-accent); }
        .pp button.pp-ghost { background:transparent; }
        .pp__btnrow { display:flex; gap:8px; margin-top:6px; }
        .pp__btnrow button { flex:1; }
        .pp input[type=file] { display:none; }
        .pp__filelabel { display:block; text-align:center; background:var(--pp-accent); color:#fff; padding:9px 14px; border-radius:7px; font-size:13px; cursor:pointer; font-weight:500; }
        .pp__status { font-size:12px; color:var(--pp-muted); margin-top:12px; min-height:18px; }

        .pp__croparea { position:relative; overflow:hidden; background:#2b2926; border-radius:10px; max-height:60vh; display:none; align-items:center; justify-content:center; }
        .pp__cropimg { display:block; max-width:100%; max-height:60vh; width:auto; height:auto; user-select:none; -webkit-user-drag:none; }
        .pp__cropbox { position:absolute; border:2px solid var(--pp-accent); cursor:move; box-shadow:0 0 0 2000px rgba(0,0,0,.55); }
        .pp__cropbox .pp-oval { position:absolute; inset:8%; border:2px dashed rgba(255,255,255,.8); border-radius:50%; pointer-events:none; }
        .pp__cropbox .pp-boxlabel { position:absolute; top:-28px; left:0; right:0; text-align:center; font-size:11px; color:#fff; background:rgba(0,0,0,.55); padding:3px 6px; border-radius:5px; pointer-events:none; }
        .pp__cropbox .pp-handle { position:absolute; width:18px; height:18px; background:var(--pp-accent); border:2px solid #fff; border-radius:50%; z-index:10; touch-action:none; }
        .pp__cropbox .pp-handle[data-corner="tl"] { top:-9px; left:-9px; cursor:nwse-resize; }
        .pp__cropbox .pp-handle[data-corner="tr"] { top:-9px; right:-9px; cursor:nesw-resize; }
        .pp__cropbox .pp-handle[data-corner="bl"] { bottom:-9px; left:-9px; cursor:nesw-resize; }
        .pp__cropbox .pp-handle[data-corner="br"] { bottom:-9px; right:-9px; cursor:nwse-resize; }
        .pp__emptycrop { color:var(--pp-muted); font-size:14px; padding:60px 20px; text-align:center; width:440px; max-width:100%; }

        .pp__checker {
          background-image: linear-gradient(45deg,#ddd 25%,transparent 25%), linear-gradient(-45deg,#ddd 25%,transparent 25%),
            linear-gradient(45deg,transparent 75%,#ddd 75%), linear-gradient(-45deg,transparent 75%,#ddd 75%);
          background-size:20px 20px; background-position:0 0,0 10px,10px -10px,-10px 0px;
          background-color:#fff; border-radius:10px; display:inline-block; touch-action:none;
        }
        .pp__bgcanvas { display:block; max-width:100%; max-height:60vh; cursor:crosshair; }
        .pp__toolgroup { display:flex; gap:8px; margin-bottom:10px; }
        .pp__toolgroup button { flex:1; }
        .pp__toolgroup button.pp-selected { border-color:var(--pp-accent); background:rgba(217,119,87,.12); font-weight:700; }

        .pp__sheetcanvas { max-width:100%; border:1px solid var(--pp-border); border-radius:8px; background:#fff; }
        .pp__hint { font-size:12px; color:var(--pp-muted); line-height:1.5; margin-bottom:8px; }
        .pp__panel--main { flex:1; min-width:320px; }
      </style>

      <div class="pp">
        <div class="pp__header">
          <h3>Passport Photo Maker</h3>
          <div class="pp__sub">Sab kuch browser me hota hai — koi photo server par upload nahi hoti.</div>
        </div>

        <div class="pp__stepper">
          <div class="pp__tab active" data-tab="1">1. Crop</div>
          <div class="pp__tab" data-tab="2">2. Background hatao</div>
          <div class="pp__tab" data-tab="3">3. Sheet banao</div>
        </div>

        <div class="pp__main">

          <!-- STEP 1: CROP -->
          <div class="pp__screen active" data-screen="1">
            <div class="pp__layout">
              <div class="pp__panel pp__sidebar">
                <h4>Photo</h4>
                <label class="pp__filelabel" for="ppFileInput">Photo chuno</label>
                <input type="file" id="ppFileInput" accept="image/*">

                <div class="pp__field" style="margin-top:16px;">
                  <label>Country / photo size</label>
                  <select id="ppSizePreset">
                    <option value="35x45">India aur zyadatar countries — 35 x 45 mm</option>
                    <option value="51x51">United States (USA) — 2 x 2 in</option>
                    <option value="custom">Custom size</option>
                  </select>
                </div>
                <div class="pp__field" id="ppCustomSizeFields" style="display:none;">
                  <label>Width (mm)</label>
                  <input type="number" id="ppCustomW" value="35" min="10" max="150">
                  <label style="margin-top:8px;">Height (mm)</label>
                  <input type="number" id="ppCustomH" value="45" min="10" max="150">
                </div>
                <div class="pp__field">
                  <label>Starting box size</label>
                  <input type="range" id="ppZoomSlider" min="20" max="95" value="55">
                </div>
                <button id="ppRedetectBtn" type="button">Face dobara detect karo</button>
                <button class="pp-primary" id="ppToStep2Btn" style="margin-top:14px;" disabled>Aage: Background hatao</button>
                <div class="pp__status" id="ppStatus1"></div>
              </div>

              <div class="pp__panel pp__panel--main">
                <div class="pp__emptycrop" id="ppEmptyCrop">Photo upload karo — face automatically detect ho jata hai aur crop box head-neck par set ho jata hai. Corners drag karke fine-tune karo.</div>
                <div class="pp__croparea" id="ppCropArea">
                  <img class="pp__cropimg" id="ppCropImg">
                  <div class="pp__cropbox" id="ppCropBox">
                    <div class="pp-oval"></div>
                    <div class="pp-boxlabel">Sirf iske andar wala hissa photo me jayega</div>
                    <div class="pp-handle" data-corner="tl"></div>
                    <div class="pp-handle" data-corner="tr"></div>
                    <div class="pp-handle" data-corner="bl"></div>
                    <div class="pp-handle" data-corner="br"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: BACKGROUND -->
          <div class="pp__screen" data-screen="2">
            <div class="pp__layout">
              <div class="pp__panel pp__sidebar">
                <h4>Background</h4>
                <p class="pp__hint">Background removal automatic hai. Kuch bacha reh jaye to brush se touch-up karo.</p>
                <div class="pp__toolgroup" style="margin-top:12px;">
                  <button id="ppEraseTool" class="pp-selected" type="button">Hatao</button>
                  <button id="ppRestoreTool" type="button">Wapas lao</button>
                </div>
                <div class="pp__field">
                  <label>Brush size</label>
                  <input type="range" id="ppBrushSize" min="8" max="80" value="26">
                </div>
                <button id="ppRerunBgBtn" type="button">Automatic removal dobara chalao</button>
                <div class="pp__btnrow" style="margin-top:14px;">
                  <button id="ppBackTo1Btn" class="pp-ghost">Peeche</button>
                  <button id="ppToStep3Btn" class="pp-primary">Aage: Sheet banao</button>
                </div>
                <div class="pp__status" id="ppStatus2"></div>
              </div>

              <div class="pp__panel pp__panel--main">
                <div class="pp__checker" id="ppCheckerWrap">
                  <canvas class="pp__bgcanvas" id="ppBgCanvas"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: COMBINE -->
          <div class="pp__screen" data-screen="3">
            <div class="pp__layout">
              <div class="pp__panel pp__sidebar">
                <h4>Sheet</h4>
                <div class="pp__field">
                  <label>Kitni photos</label>
                  <input type="number" id="ppCountInput" value="4" min="1" max="40">
                </div>
                <div class="pp__field">
                  <label>Paper size</label>
                  <select id="ppPaperSize">
                    <option value="4x6">4 x 6 in (photo print)</option>
                    <option value="5x7">5 x 7 in</option>
                    <option value="a4">A4</option>
                  </select>
                </div>
                <button class="pp-primary" id="ppGenerateBtn">Sheet banao</button>
                <button id="ppDownloadPng" style="margin-top:8px; display:none;">PNG download karo</button>
                <button id="ppDownloadPdf" style="margin-top:8px; display:none;">PDF download karo (printing ke liye)</button>
                <div class="pp__btnrow" style="margin-top:14px;">
                  <button id="ppBackTo2Btn" class="pp-ghost">Peeche</button>
                </div>
                <div class="pp__status" id="ppStatus3"></div>
              </div>

              <div class="pp__panel pp__panel--main">
                <p class="pp__hint">Dashed lines dikhati hain ki kahan cut karna hai.</p>
                <canvas class="pp__sheetcanvas" id="ppSheetCanvas"></canvas>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    const root = container;
    const q = (sel) => root.querySelector(sel);

    // ---------- shared state ----------
    let naturalImg = null;
    let faceModelReady = false;
    let step1Canvas = null;
    let step2Canvas = null;
    let bgRemovalFn = null;

    function setStatus(msg, el = 'ppStatus1') {
      const node = q('#' + el);
      if (node) node.textContent = msg || '';
    }
    function sizeMm() {
      const v = sizePreset.value;
      if (v === '35x45') return [35, 45];
      if (v === '51x51') return [51, 51];
      return [parseFloat(customW.value) || 35, parseFloat(customH.value) || 45];
    }
    function mmToPx(mm) { return Math.round((mm / 25.4) * 300); } // 300 DPI

    function showScreen(n) {
      [1, 2, 3].forEach((i) => {
        const screen = q(`.pp__screen[data-screen="${i}"]`);
        const tab = q(`.pp__tab[data-tab="${i}"]`);
        screen.classList.toggle('active', i === n);
        tab.classList.toggle('active', i === n);
        tab.classList.toggle('done', i < n);
      });
    }

    // ================= STEP 1: CROP =================
    const fileInput = q('#ppFileInput');
    const cropArea = q('#ppCropArea');
    const cropImg = q('#ppCropImg');
    const cropBox = q('#ppCropBox');
    const emptyCrop = q('#ppEmptyCrop');
    const zoomSlider = q('#ppZoomSlider');
    const sizePreset = q('#ppSizePreset');
    const customFields = q('#ppCustomSizeFields');
    const customW = q('#ppCustomW');
    const customH = q('#ppCustomH');
    const toStep2Btn = q('#ppToStep2Btn');

    function onSizePresetChange() {
      customFields.style.display = sizePreset.value === 'custom' ? 'block' : 'none';
      if (naturalImg) autoPlaceCropBox(); else layoutCropBox();
    }
    function onCustomFieldInput() {
      if (naturalImg) autoPlaceCropBox(); else layoutCropBox();
    }
    function onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        naturalImg = new Image();
        naturalImg.onload = () => {
          cropBox.style.left = ''; cropBox.style.top = ''; cropBox.style.width = ''; cropBox.style.height = '';
          cropImg.onload = () => {
            emptyCrop.style.display = 'none';
            cropArea.style.display = 'flex';
            toStep2Btn.disabled = false;
            requestAnimationFrame(() => requestAnimationFrame(async () => {
              layoutCropBox();
              await autoPlaceCropBox();
            }));
          };
          cropImg.src = ev.target.result;
        };
        naturalImg.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function layoutCropBox() {
      if (!cropImg.clientWidth || !cropImg.clientHeight) return;
      const [w, h] = sizeMm();
      const ratio = w / h;
      const zoom = parseInt(zoomSlider.value, 10) / 100;
      const areaW = cropImg.clientWidth, areaH = cropImg.clientHeight;
      let boxH = areaH * zoom;
      let boxW = boxH * ratio;
      if (boxW > areaW * 0.98) { boxW = areaW * 0.98; boxH = boxW / ratio; }
      if (boxH > areaH * 0.98) { boxH = areaH * 0.98; boxW = boxH * ratio; }
      const prevLeft = parseFloat(cropBox.style.left);
      const prevTop = parseFloat(cropBox.style.top);
      const curLeft = Number.isFinite(prevLeft) ? prevLeft : (areaW - boxW) / 2;
      const curTop = Number.isFinite(prevTop) ? prevTop : (areaH - boxH) / 2;
      cropBox.style.width = boxW + 'px';
      cropBox.style.height = boxH + 'px';
      cropBox.style.left = Math.min(Math.max(0, curLeft), areaW - boxW) + 'px';
      cropBox.style.top = Math.min(Math.max(0, curTop), areaH - boxH) + 'px';
    }
    function onResize() { layoutCropBox(); }

    async function ensureFaceModel() {
      if (faceModelReady) return true;
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(
        'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'
      );
      faceModelReady = true;
      return true;
    }

    async function autoPlaceCropBox() {
      setStatus('Face detect ho raha hai...');
      try {
        await ensureFaceModel();
        const detection = await window.faceapi.detectSingleFace(naturalImg, new window.faceapi.TinyFaceDetectorOptions());
        if (!detection) {
          setStatus('Face auto-detect nahi ho paaya — box ko manually face-neck par set karo.');
          return;
        }
        const [wMm, hMm] = sizeMm();
        const ratio = wMm / hMm;
        const fb = detection.box;
        const cx = fb.x + fb.width / 2;
        const cy = fb.y + fb.height / 2;
        let boxH = fb.height * 2.6;
        let boxW = boxH * ratio;
        if (boxW < fb.width * 1.5) { boxW = fb.width * 1.5; boxH = boxW / ratio; }
        let top = cy - boxH * 0.42;
        let left = cx - boxW / 2;
        top = Math.min(Math.max(0, top), naturalImg.naturalHeight - boxH);
        left = Math.min(Math.max(0, left), naturalImg.naturalWidth - boxW);
        boxW = Math.min(boxW, naturalImg.naturalWidth);
        boxH = Math.min(boxH, naturalImg.naturalHeight);
        const scaleX = cropImg.clientWidth / naturalImg.naturalWidth;
        const scaleY = cropImg.clientHeight / naturalImg.naturalHeight;
        cropBox.style.left = (left * scaleX) + 'px';
        cropBox.style.top = (top * scaleY) + 'px';
        cropBox.style.width = (boxW * scaleX) + 'px';
        cropBox.style.height = (boxH * scaleY) + 'px';
        setStatus('Face detect ho gaya — zaroorat ho to box fine-tune karo, phir Next dabao.');
      } catch (err) {
        setStatus('Auto face-detection fail hui, box manually set karo. (' + err.message + ')');
      }
    }
    function onRedetectClick() { if (naturalImg) autoPlaceCropBox(); }

    // drag to move
    let dragging = false, startX, startY, startLeft, startTop;
    function onCropBoxPointerDown(e) {
      if (e.target.classList.contains('pp-handle')) return;
      dragging = true; startX = e.clientX; startY = e.clientY;
      startLeft = parseFloat(cropBox.style.left); startTop = parseFloat(cropBox.style.top);
      cropBox.setPointerCapture(e.pointerId);
    }
    function onCropBoxPointerMove(e) {
      if (!dragging) return;
      const areaW = cropImg.clientWidth, areaH = cropImg.clientHeight;
      const boxW = cropBox.offsetWidth, boxH = cropBox.offsetHeight;
      let newLeft = startLeft + (e.clientX - startX);
      let newTop = startTop + (e.clientY - startY);
      newLeft = Math.min(Math.max(0, newLeft), areaW - boxW);
      newTop = Math.min(Math.max(0, newTop), areaH - boxH);
      cropBox.style.left = newLeft + 'px'; cropBox.style.top = newTop + 'px';
    }
    function onCropBoxPointerUp() { dragging = false; }

    // corner resize, aspect locked
    let resizing = null;
    const handles = Array.from(root.querySelectorAll('.pp__cropbox .pp-handle'));
    const handleDownFns = [], handleMoveFns = [], handleUpFns = [];
    handles.forEach((handle) => {
      const down = (e) => {
        e.stopPropagation();
        const corner = handle.dataset.corner;
        const boxLeft = parseFloat(cropBox.style.left), boxTop = parseFloat(cropBox.style.top);
        const boxW = cropBox.offsetWidth, boxH = cropBox.offsetHeight;
        resizing = { corner, anchorX: corner.includes('l') ? boxLeft + boxW : boxLeft, anchorY: corner.includes('t') ? boxTop + boxH : boxTop };
        handle.setPointerCapture(e.pointerId);
      };
      const move = (e) => {
        if (!resizing) return;
        const [w, h] = sizeMm(); const ratio = w / h;
        const areaW = cropImg.clientWidth, areaH = cropImg.clientHeight;
        const rect = cropImg.getBoundingClientRect();
        const mouseX = Math.min(Math.max(0, e.clientX - rect.left), areaW);
        const mouseY = Math.min(Math.max(0, e.clientY - rect.top), areaH);
        let newW = Math.abs(mouseX - resizing.anchorX);
        let newH = newW / ratio;
        const altH = Math.abs(mouseY - resizing.anchorY);
        const altW = altH * ratio;
        if (altW > newW) { newW = altW; newH = altH; }
        newW = Math.max(30, Math.min(newW, areaW));
        newH = Math.max(30 / ratio, Math.min(newH, areaH));
        newW = newH * ratio;
        const newLeft = resizing.corner.includes('l') ? resizing.anchorX - newW : resizing.anchorX;
        const newTop = resizing.corner.includes('t') ? resizing.anchorY - newH : resizing.anchorY;
        const clampedLeft = Math.min(Math.max(0, newLeft), areaW - newW);
        const clampedTop = Math.min(Math.max(0, newTop), areaH - newH);
        cropBox.style.left = clampedLeft + 'px'; cropBox.style.top = clampedTop + 'px';
        cropBox.style.width = newW + 'px'; cropBox.style.height = newH + 'px';
      };
      const up = () => { resizing = null; };
      handle.addEventListener('pointerdown', down);
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handleDownFns.push(down); handleMoveFns.push(move); handleUpFns.push(up);
    });

    function getCroppedCanvas() {
      const [wMm, hMm] = sizeMm();
      const targetW = mmToPx(wMm), targetH = mmToPx(hMm);
      const scaleX = naturalImg.naturalWidth / cropImg.clientWidth;
      const scaleY = naturalImg.naturalHeight / cropImg.clientHeight;
      const sx = parseFloat(cropBox.style.left) * scaleX;
      const sy = parseFloat(cropBox.style.top) * scaleY;
      const sw = cropBox.offsetWidth * scaleX;
      const sh = cropBox.offsetHeight * scaleY;
      const out = document.createElement('canvas');
      out.width = targetW; out.height = targetH;
      out.getContext('2d').drawImage(naturalImg, sx, sy, sw, sh, 0, 0, targetW, targetH);
      return out;
    }

    // ================= STEP 2: BACKGROUND =================
    const bgCanvas = q('#ppBgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    const eraseTool = q('#ppEraseTool');
    const restoreTool = q('#ppRestoreTool');
    const brushSize = q('#ppBrushSize');
    let currentTool = 'erase';

    function onEraseToolClick() { currentTool = 'erase'; eraseTool.classList.add('pp-selected'); restoreTool.classList.remove('pp-selected'); }
    function onRestoreToolClick() { currentTool = 'restore'; restoreTool.classList.add('pp-selected'); eraseTool.classList.remove('pp-selected'); }

    async function onToStep2Click() {
      step1Canvas = getCroppedCanvas();
      showScreen(2);
      await runAutoBackgroundRemoval();
    }
    function onBackTo1Click() { showScreen(1); }
    function onRerunBgClick() { runAutoBackgroundRemoval(); }

    async function ensureBgRemoval() {
      if (bgRemovalFn) return bgRemovalFn;
      const mod = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.8/+esm');
      bgRemovalFn = mod.removeBackground || mod.default;
      return bgRemovalFn;
    }

    async function runAutoBackgroundRemoval() {
      setStatus('Background hataya ja raha hai — pehli baar ~40MB model download hota hai, 30-60s lag sakte hain.', 'ppStatus2');
      try {
        const removeBg = await ensureBgRemoval();
        const inputBlob = await new Promise((resolve) => step1Canvas.toBlob(resolve, 'image/png'));
        const resultBlob = await removeBg(inputBlob, { output: { format: 'image/png' } });
        const url = URL.createObjectURL(resultBlob);
        const cutout = new Image();
        await new Promise((resolve, reject) => { cutout.onload = resolve; cutout.onerror = reject; cutout.src = url; });
        URL.revokeObjectURL(url);

        step2Canvas = document.createElement('canvas');
        step2Canvas.width = step1Canvas.width; step2Canvas.height = step1Canvas.height;
        step2Canvas.getContext('2d').drawImage(cutout, 0, 0, step2Canvas.width, step2Canvas.height);

        bgCanvas.width = step2Canvas.width; bgCanvas.height = step2Canvas.height;
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(step2Canvas, 0, 0);
        setStatus('Background hat gaya. Bacha hua hissa brush se saaf karo.', 'ppStatus2');
      } catch (err) {
        step2Canvas = document.createElement('canvas');
        step2Canvas.width = step1Canvas.width; step2Canvas.height = step1Canvas.height;
        step2Canvas.getContext('2d').drawImage(step1Canvas, 0, 0);
        bgCanvas.width = step2Canvas.width; bgCanvas.height = step2Canvas.height;
        bgCtx.drawImage(step2Canvas, 0, 0);
        setStatus('Automatic removal fail hui, plain crop dikha rahe hain. (' + err.message + ')', 'ppStatus2');
      }
    }

    // brush editing on bgCanvas
    let painting = false;
    function canvasPointFromEvent(e) {
      const rect = bgCanvas.getBoundingClientRect();
      const scaleX = bgCanvas.width / rect.width;
      const scaleY = bgCanvas.height / rect.height;
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
    function paintAt(x, y) {
      const r = parseInt(brushSize.value, 10) * (bgCanvas.width / bgCanvas.getBoundingClientRect().width);
      if (currentTool === 'erase') {
        bgCtx.save();
        bgCtx.globalCompositeOperation = 'destination-out';
        bgCtx.beginPath(); bgCtx.arc(x, y, r, 0, Math.PI * 2); bgCtx.fill();
        bgCtx.restore();
      } else {
        bgCtx.save();
        bgCtx.beginPath(); bgCtx.arc(x, y, r, 0, Math.PI * 2); bgCtx.clip();
        bgCtx.drawImage(step1Canvas, 0, 0);
        bgCtx.restore();
      }
    }
    function onBgCanvasPointerDown(e) { painting = true; const p = canvasPointFromEvent(e); paintAt(p.x, p.y); }
    function onBgCanvasPointerMove(e) { if (!painting) return; const p = canvasPointFromEvent(e); paintAt(p.x, p.y); }
    function onWindowPointerUp() { painting = false; }

    function onToStep3Click() { showScreen(3); }

    // ================= STEP 3: COMBINE =================
    function onBackTo2Click() { showScreen(2); }
    const sheetCanvas = q('#ppSheetCanvas');
    const downloadPngBtn = q('#ppDownloadPng');
    const downloadPdfBtn = q('#ppDownloadPdf');
    const countInput = q('#ppCountInput');
    const paperSize = q('#ppPaperSize');

    function paperPx() {
      const v = paperSize.value;
      if (v === '4x6') return [mmToPx(101.6), mmToPx(152.4)];
      if (v === '5x7') return [mmToPx(127), mmToPx(177.8)];
      return [mmToPx(210), mmToPx(297)];
    }

    function onGenerateClick() {
      const finalPhoto = document.createElement('canvas');
      finalPhoto.width = bgCanvas.width; finalPhoto.height = bgCanvas.height;
      const fctx = finalPhoto.getContext('2d');
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, finalPhoto.width, finalPhoto.height);
      fctx.drawImage(bgCanvas, 0, 0);

      const count = Math.max(1, Math.min(40, parseInt(countInput.value, 10) || 4));
      const [sheetW, sheetH] = paperPx();
      const margin = mmToPx(6), gap = mmToPx(3);
      const pw = finalPhoto.width, ph = finalPhoto.height;
      const cols = Math.max(1, Math.floor((sheetW - margin * 2 + gap) / (pw + gap)));
      const rows = Math.max(1, Math.floor((sheetH - margin * 2 + gap) / (ph + gap)));
      const maxFit = cols * rows;
      const actualCount = Math.min(count, maxFit);

      sheetCanvas.width = sheetW; sheetCanvas.height = sheetH;
      const ctx = sheetCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sheetW, sheetH);

      const gridW = cols * pw + (cols - 1) * gap, gridH = rows * ph + (rows - 1) * gap;
      const offsetX = (sheetW - gridW) / 2, offsetY = (sheetH - gridH) / 2;
      let placed = 0;
      for (let r = 0; r < rows && placed < actualCount; r++) {
        for (let c = 0; c < cols && placed < actualCount; c++) {
          const x = offsetX + c * (pw + gap), y = offsetY + r * (ph + gap);
          ctx.drawImage(finalPhoto, x, y);
          ctx.strokeStyle = '#bbbbbb'; ctx.setLineDash([4, 4]); ctx.strokeRect(x, y, pw, ph); ctx.setLineDash([]);
          placed++;
        }
      }
      downloadPngBtn.style.display = 'block'; downloadPdfBtn.style.display = 'block';
      setStatus(actualCount < count ? `Is paper size par sirf ${maxFit} photos fit hui — ${actualCount} lagayi gayi.` : `${actualCount} photos taiyaar hain.`, 'ppStatus3');
    }

    function onDownloadPngClick() {
      const url = sheetCanvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'passport-photos.png';
      document.body.appendChild(a); a.click(); a.remove();
    }
    async function onDownloadPdfClick() {
      setStatus('PDF ban raha hai...', 'ppStatus3');
      const pngBytes = sheetCanvas.toDataURL('image/png');
      const doc = await window.PDFLib.PDFDocument.create();
      const img = await doc.embedPng(pngBytes);
      const page = doc.addPage([sheetCanvas.width * 0.24, sheetCanvas.height * 0.24]);
      page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'passport-photos.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setStatus('PDF download ho gayi.', 'ppStatus3');
    }

    // ---------- wire up ----------
    sizePreset.addEventListener('change', onSizePresetChange);
    customW.addEventListener('input', onCustomFieldInput);
    customH.addEventListener('input', onCustomFieldInput);
    fileInput.addEventListener('change', onFileChange);
    zoomSlider.addEventListener('input', layoutCropBox);
    window.addEventListener('resize', onResize);
    q('#ppRedetectBtn').addEventListener('click', onRedetectClick);
    cropBox.addEventListener('pointerdown', onCropBoxPointerDown);
    cropBox.addEventListener('pointermove', onCropBoxPointerMove);
    cropBox.addEventListener('pointerup', onCropBoxPointerUp);
    eraseTool.addEventListener('click', onEraseToolClick);
    restoreTool.addEventListener('click', onRestoreToolClick);
    toStep2Btn.addEventListener('click', onToStep2Click);
    q('#ppBackTo1Btn').addEventListener('click', onBackTo1Click);
    q('#ppRerunBgBtn').addEventListener('click', onRerunBgClick);
    bgCanvas.addEventListener('pointerdown', onBgCanvasPointerDown);
    bgCanvas.addEventListener('pointermove', onBgCanvasPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    q('#ppToStep3Btn').addEventListener('click', onToStep3Click);
    q('#ppBackTo2Btn').addEventListener('click', onBackTo2Click);
    q('#ppGenerateBtn').addEventListener('click', onGenerateClick);
    downloadPngBtn.addEventListener('click', onDownloadPngClick);
    downloadPdfBtn.addEventListener('click', onDownloadPdfClick);

    return () => {
      sizePreset.removeEventListener('change', onSizePresetChange);
      customW.removeEventListener('input', onCustomFieldInput);
      customH.removeEventListener('input', onCustomFieldInput);
      fileInput.removeEventListener('change', onFileChange);
      zoomSlider.removeEventListener('input', layoutCropBox);
      window.removeEventListener('resize', onResize);
      cropBox.removeEventListener('pointerdown', onCropBoxPointerDown);
      cropBox.removeEventListener('pointermove', onCropBoxPointerMove);
      cropBox.removeEventListener('pointerup', onCropBoxPointerUp);
      handles.forEach((handle, i) => {
        handle.removeEventListener('pointerdown', handleDownFns[i]);
        handle.removeEventListener('pointermove', handleMoveFns[i]);
        handle.removeEventListener('pointerup', handleUpFns[i]);
      });
      eraseTool.removeEventListener('click', onEraseToolClick);
      restoreTool.removeEventListener('click', onRestoreToolClick);
      toStep2Btn.removeEventListener('click', onToStep2Click);
      bgCanvas.removeEventListener('pointerdown', onBgCanvasPointerDown);
      bgCanvas.removeEventListener('pointermove', onBgCanvasPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      downloadPngBtn.removeEventListener('click', onDownloadPngClick);
      downloadPdfBtn.removeEventListener('click', onDownloadPdfClick);
      naturalImg = null; step1Canvas = null; step2Canvas = null;
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
      'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
      () => typeof window.faceapi !== 'undefined'
    ),
  ]);
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

export default PassportPhoto;
