/**
 * ID Card Generator
 * Rebuilt as an independent module against the mount(container, context)
 * contract. Rendered inside a Shadow DOM so its CSS can never leak into
 * (or be broken by) any other tool or the dashboard shell.
 *
 * External libraries (QRCode, html2canvas, jsPDF) are lazy-loaded only
 * when this tool is opened, via context.loadDependency.
 */

const CARD_CSS = `
  :host{all:initial}
  *{box-sizing:border-box}
  .wrap{
    font-family:'Segoe UI',Arial,sans-serif;
    color:#182620;
  }
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
  .btn{
    background:linear-gradient(120deg,#0a5a42,#1c9e74);color:#fff;border:none;
    padding:11px 20px;font-size:13.5px;font-weight:600;border-radius:9px;cursor:pointer;
  }
  .btn:disabled{opacity:.6;cursor:progress}
  .btn.secondary{background:#eceff0;color:#182620}
  .hint{font-size:12.5px;color:#5f6f68;margin:0 0 16px}
  .stage{display:flex;flex-wrap:wrap;gap:24px;justify-content:center}
  .card{
    width:340px;height:236px;border-radius:14px;background:#fff;
    box-shadow:0 6px 18px rgba(10,60,45,.2);overflow:hidden;position:relative;
    border:1px solid #d8ded9;
  }
  .front .band{
    background:linear-gradient(120deg,#0a5a42 0%,#0f7a56 55%,#1c9e74 100%);
    color:#fff;padding:8px 12px 10px;display:flex;align-items:center;gap:8px;position:relative;
  }
  .front .band::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:3px;
    background:linear-gradient(90deg,#f2a71b,#f7c352,#f2a71b);}
  .logo-box{
    width:38px;height:38px;border-radius:50%;background:#fff;display:flex;align-items:center;
    justify-content:center;flex-shrink:0;overflow:hidden;cursor:pointer;font-size:9px;text-align:center;color:#889;
  }
  .logo-box img{width:100%;height:100%;object-fit:contain}
  .org-name{font-size:12.5px;font-weight:700;line-height:1.2;outline:none}
  .org-sub{font-size:9px;opacity:.9;outline:none}
  .body{display:flex;gap:10px;padding:10px 12px}
  .photo-box{
    width:80px;height:100px;border:1.5px dashed #f2a71b;border-radius:6px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;font-size:10px;color:#889;
    text-align:center;background:#f7f8f7;overflow:hidden;cursor:pointer;
  }
  .photo-box img{width:100%;height:100%;object-fit:cover}
  .fields{font-size:11px;line-height:1.55;width:100%}
  .fields .row{display:flex;align-items:baseline}
  .fields .label{width:76px;font-weight:600;color:#0a5a42;flex-shrink:0}
  .fields .colon{width:6px;flex-shrink:0}
  .fields .val{outline:none;border-bottom:1px dotted transparent;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fields .val:focus{border-bottom:1px dotted #f2a71b;white-space:normal;overflow:visible}
  .idno{position:absolute;left:12px;bottom:30px;font-weight:700;font-size:12px;color:#0a5a42;outline:none}
  .qr-box{
    position:absolute;right:10px;bottom:24px;width:54px;height:54px;background:#fff;
    border:1px solid #d8ded9;border-radius:5px;padding:2px;display:flex;align-items:center;
    justify-content:center;overflow:hidden;
  }
  .qr-box img,.qr-box canvas{width:100%;height:100%;display:block}
  .qr-placeholder{font-size:7px;color:#aab;text-align:center}
  .front .footer{
    position:absolute;bottom:0;left:0;right:0;
    background:linear-gradient(120deg,#1c9e74,#0a5a42);color:#fff;font-size:8.5px;padding:5px 12px;outline:none;
  }
  .back{padding:14px 16px;font-size:9.6px;line-height:1.55}
  .back h2{font-size:12px;color:#0a5a42;margin:0 0 6px;border-bottom:2px solid #f2a71b;display:inline-block;padding-bottom:2px;outline:none}
  .back ol{margin:0 0 8px;padding-left:16px;outline:none}
  .back ol li{margin-bottom:3px}
  .back .contact{font-size:9px;border-top:1px solid #d8ded9;padding-top:6px;margin-top:6px;outline:none}
  .back .sign{position:absolute;right:16px;bottom:14px;text-align:center;font-size:8.5px}
  .back .sign .line{width:90px;border-top:1px solid #888;margin-bottom:2px}
  .editable:hover{background:#fff8e0}
  .status{text-align:center;font-size:12px;color:#0a5a42;margin-top:12px;min-height:16px}
  input[type=file]{display:none}
`;

function svgDataUrlFromCanvas(canvas) {
  return canvas.toDataURL('image/png');
}

export const IDCardTool = {
  id: 'id-card',

  async mount(container, context) {
    const host = document.createElement('div');
    container.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CARD_CSS;
    shadow.appendChild(style);

    const root = document.createElement('div');
    root.className = 'wrap';
    root.innerHTML = `
      <p class="hint">Click on any text to edit it. Click on the photo/logo to upload it.</p>
      <div class="toolbar">
        <button class="btn" id="pdf-btn" type="button">📄 Generate PDF</button>
        <button class="btn secondary" id="reset-btn" type="button">Reset</button>
      </div>

      <div class="stage" id="stage">
        <div class="card front" id="card-front">
          <div class="band">
           <div class="logo-box" id="logo-box" title="Click to upload logo"><img src="assets/logo.jpeg" alt="logo"></div>
            <input type="file" id="logo-input" accept="image/*">
            <div>
              <div class="org-name editable" contenteditable="true">Ashwani Mahila Kalyan Samiti</div>
              <div class="org-sub editable" contenteditable="true">Mohammadi Kheri, Uttar Pradesh - 262804</div>
            </div>
          </div>
          <div class="body">
            <div class="photo-box" id="photo-box" title="Click to upload photo">Click here<br>to upload<br>photo</div>
            <input type="file" id="photo-input" accept="image/*">
            <div class="fields">
              <div class="row"><div class="label">Name</div><div class="colon">:</div><div class="val editable" contenteditable="true">Student Name</div></div>
              <div class="row"><div class="label">Father's Name</div><div class="colon">:</div><div class="val editable" contenteditable="true">Father's Name</div></div>
              <div class="row"><div class="label">Course</div><div class="colon">:</div><div class="val editable" contenteditable="true">Course / Class</div></div>
              <div class="row"><div class="label">DOB</div><div class="colon">:</div><div class="val editable" contenteditable="true">01/01/2016</div></div>
              <div class="row"><div class="label">Batch No.</div><div class="colon">:</div><div class="val editable" contenteditable="true">000000000000</div></div>
              <div class="row"><div class="label">Mobile</div><div class="colon">:</div><div class="val editable" contenteditable="true">9876543210</div></div>
            </div>
          </div>
          <div class="idno editable" contenteditable="true">ID No: 0000001</div>
          <div class="qr-box" id="qr-box"><div class="qr-placeholder">QR</div></div>
          <div class="footer editable" contenteditable="true">📍Swami Ramashram Inter Collage, Mohammadi Kheri, Uttar Pradesh - 262804</div>
        </div>

        <div class="card back" id="card-back">
          <h2 class="editable" contenteditable="true">Instructions</h2>
          <ol contenteditable="true">
            <li>This card is the property of the institution. Do not misuse it.</li>
            <li>If lost, inform the office immediately.</li>
            <li>Always carry the card; do not hand it to others.</li>
            <li>Do not tamper with or damage the card.</li>
            <li> Do not allow anyone else to use the card.</li>
          
          </ol>
          <div class="contact editable" contenteditable="true">Helpline: 0000000000</div>
          <div class="sign">
            <div class="line"></div>
            <div class="editable" contenteditable="true">Authorised Signatory</div>
          </div>
        </div>
      </div>

      <div class="status" id="status"></div>
    `;
    shadow.appendChild(root);

    // ---------- element refs (scoped to this shadow root) ----------
    const pdfBtn = root.querySelector('#pdf-btn');
    const resetBtn = root.querySelector('#reset-btn');
    const stage = root.querySelector('#stage');
    const front = root.querySelector('#card-front');
    const back = root.querySelector('#card-back');
    const statusEl = root.querySelector('#status');
    const photoBox = root.querySelector('#photo-box');
    const photoInput = root.querySelector('#photo-input');
    const logoBox = root.querySelector('#logo-box');
    const logoInput = root.querySelector('#logo-input');
    const idnoEl = root.querySelector('.idno');
    const qrBox = root.querySelector('#qr-box');

    // ---------- state we own and must clean up ----------
    let photoObjectUrl = null;
    let logoObjectUrl = null;
    let qrDebounce = null;
    let destroyed = false;
    let pdfDepsLoaded = false;

    // ---------- photo / logo upload ----------
    const openPhotoPicker = () => photoInput.click();
    const openLogoPicker = () => logoInput.click();

    const handlePhotoChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
      photoObjectUrl = URL.createObjectURL(file);
      photoBox.innerHTML = `<img src="${photoObjectUrl}" alt="photo">`;
    };

    const handleLogoChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
      logoObjectUrl = URL.createObjectURL(file);
      logoBox.innerHTML = `<img src="${logoObjectUrl}" alt="logo">`;
    };

    photoBox.addEventListener('click', openPhotoPicker);
    photoInput.addEventListener('change', handlePhotoChange);
    logoBox.addEventListener('click', openLogoPicker);
    logoInput.addEventListener('change', handleLogoChange);

    // ---------- QR code (lazy-loaded, debounced on ID number edits) ----------
    async function updateQRCode() {
      if (destroyed) return;
      const idText = idnoEl.textContent.replace(/ID No[:\s]*/i, '').trim();
      if (!idText) {
        qrBox.innerHTML = '<div class="qr-placeholder">QR</div>';
        return;
      }
      try {
        await context.loadDependency.loadQRCode();
      } catch {
        qrBox.innerHTML = '<div class="qr-placeholder">QR</div>';
        return;
      }
      if (destroyed) return;

      const tempHolder = document.createElement('div');
      tempHolder.style.position = 'absolute';
      tempHolder.style.left = '-9999px';
      document.body.appendChild(tempHolder);

      // eslint-disable-next-line no-undef
      new QRCode(tempHolder, { text: idText, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
      const qrCanvas = tempHolder.querySelector('canvas');
      const dataUrl = qrCanvas ? svgDataUrlFromCanvas(qrCanvas) : '';
      document.body.removeChild(tempHolder);

      if (destroyed) return;
      qrBox.innerHTML = dataUrl ? `<img src="${dataUrl}" alt="QR">` : '<div class="qr-placeholder">QR</div>';
    }

    const handleIdInput = () => {
      clearTimeout(qrDebounce);
      qrDebounce = setTimeout(updateQRCode, 300);
    };

    idnoEl.addEventListener('input', handleIdInput);
    idnoEl.addEventListener('blur', updateQRCode);
    updateQRCode();

    // ---------- PDF generation (idempotent — guarded by disabled state) ----------
    function waitForImages(el) {
      const imgs = Array.from(el.querySelectorAll('img'));
      return Promise.all(imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }));
    }

    let generating = false;
    async function generatePDF() {
      if (generating) return; // idempotent: ignore re-entrant clicks
      generating = true;
      pdfBtn.disabled = true;
      statusEl.textContent = 'PDF ban raha hai, kripya intezaar karein…';
      stage.classList.add('capturing');

      try {
        if (!pdfDepsLoaded) {
          await context.loadDependency.loadAll(['loadHtml2Canvas', 'loadJsPDF']);
          pdfDepsLoaded = true;
        }
        if (destroyed) return;

        await waitForImages(front);
        await waitForImages(back);

        const scale = 3;
        // eslint-disable-next-line no-undef
        const c1 = await html2canvas(front, { scale, backgroundColor: '#ffffff', useCORS: true });
        // eslint-disable-next-line no-undef
        const c2 = await html2canvas(back, { scale, backgroundColor: '#ffffff', useCORS: true });

        const gapPx = 20 * scale;
        const combined = document.createElement('canvas');
        combined.width = c1.width + c2.width + gapPx;
        combined.height = Math.max(c1.height, c2.height);
        const ctx = combined.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, combined.width, combined.height);
        ctx.drawImage(c1, 0, 0);
        ctx.drawImage(c2, c1.width + gapPx, 0);

        const imgData = combined.toDataURL('image/png');

        const pxToMM = 25.4 / 96;
        const cardWmm = 340 * pxToMM;
        const cardHmm = 236 * pxToMM;
        const gapMm = 20 * pxToMM;
        const totalWmm = cardWmm * 2 + gapMm;
        const totalHmm = cardHmm;
        const marginMm = 10;

        // eslint-disable-next-line no-undef
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [totalWmm + marginMm * 2, totalHmm + marginMm * 2],
        });
        pdf.addImage(imgData, 'PNG', marginMm, marginMm, totalWmm, totalHmm);

        const nameEl = front.querySelector('.fields .val');
        const rawName = (nameEl ? nameEl.textContent.trim() : 'student').replace(/[^a-zA-Z0-9]+/g, '_') || 'student';

        const blob = pdf.output('blob');
        context.downloadFile(blob, `ID_Card_${rawName}.pdf`);

        statusEl.textContent = 'PDF download ho gaya ✅';
        context.toast('ID card PDF taiyar hai');
      } catch (err) {
        console.error('[id-card] PDF generation failed', err);
        statusEl.textContent = 'Error aaya, dubara koshish karein.';
        context.toast('PDF banane mein error aaya', { type: 'error' });
      } finally {
        stage.classList.remove('capturing');
        pdfBtn.disabled = false;
        generating = false;
      }
    }

    pdfBtn.addEventListener('click', generatePDF);

    // ---------- reset ----------
    const handleReset = () => {
      if (!confirm('Sabhi fields reset karein?')) return;
      if (photoObjectUrl) { URL.revokeObjectURL(photoObjectUrl); photoObjectUrl = null; }
      if (logoObjectUrl) { URL.revokeObjectURL(logoObjectUrl); logoObjectUrl = null; }
      photoBox.innerHTML = 'Photo yahan<br>click karke<br>upload karein';
      logoBox.innerHTML = 'LOGO';
      root.querySelectorAll('.editable').forEach((elm) => {
        // Leave structural elements (ol) alone; only reset simple text fields.
        if (elm.tagName !== 'OL') elm.textContent = elm.tagName === 'H2' ? 'Instructions' : '';
      });
      updateQRCode();
      statusEl.textContent = '';
    };
    resetBtn.addEventListener('click', handleReset);

    // ---------- cleanup (must be safe to call once, and only once) ----------
    return () => {
      destroyed = true;
      clearTimeout(qrDebounce);
      photoBox.removeEventListener('click', openPhotoPicker);
      photoInput.removeEventListener('change', handlePhotoChange);
      logoBox.removeEventListener('click', openLogoPicker);
      logoInput.removeEventListener('change', handleLogoChange);
      idnoEl.removeEventListener('input', handleIdInput);
      idnoEl.removeEventListener('blur', updateQRCode);
      pdfBtn.removeEventListener('click', generatePDF);
      resetBtn.removeEventListener('click', handleReset);
      if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
      if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
      host.remove();
    };
  },
};

export default IDCardTool;
