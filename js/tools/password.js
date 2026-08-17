const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}',
};

function generate(length, opts) {
  let pool = '';
  if (opts.lower) pool += SETS.lower;
  if (opts.upper) pool += SETS.upper;
  if (opts.digits) pool += SETS.digits;
  if (opts.symbols) pool += SETS.symbols;
  if (!pool) pool = SETS.lower + SETS.digits;

  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) out += pool[bytes[i] % pool.length];
  return out;
}

export const PasswordTool = {
  id: 'password',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-row">
        <div class="t-field"><label for="pw-len">Length</label><input id="pw-len" type="number" min="4" max="64" value="14"></div>
      </div>
      <div class="t-row">
        <label><input type="checkbox" id="pw-upper" checked> Uppercase</label>
        <label><input type="checkbox" id="pw-lower" checked> Lowercase</label>
        <label><input type="checkbox" id="pw-digits" checked> Numbers</label>
        <label><input type="checkbox" id="pw-symbols"> Symbols</label>
      </div>
      <button class="t-btn" id="pw-gen" type="button">Generate Password</button>
      <div class="t-field"><input id="pw-out" readonly style="font-size:16px;letter-spacing:1px"></div>
      <button class="t-btn secondary" id="pw-copy" type="button">Copy</button>
    `;

    const lenEl = container.querySelector('#pw-len');
    const upperEl = container.querySelector('#pw-upper');
    const lowerEl = container.querySelector('#pw-lower');
    const digitsEl = container.querySelector('#pw-digits');
    const symbolsEl = container.querySelector('#pw-symbols');
    const outEl = container.querySelector('#pw-out');
    const genBtn = container.querySelector('#pw-gen');
    const copyBtn = container.querySelector('#pw-copy');

    const handleGen = () => {
      const length = Math.min(64, Math.max(4, parseInt(lenEl.value, 10) || 14));
      outEl.value = generate(length, {
        upper: upperEl.checked,
        lower: lowerEl.checked,
        digits: digitsEl.checked,
        symbols: symbolsEl.checked,
      });
    };

    const handleCopy = async () => {
      if (!outEl.value) return;
      try {
        await navigator.clipboard.writeText(outEl.value);
        context.toast('Password copy ho gaya');
      } catch {
        outEl.select();
        context.toast('Select ho gaya, Ctrl+C dabayein', { type: 'error' });
      }
    };

    genBtn.addEventListener('click', handleGen);
    copyBtn.addEventListener('click', handleCopy);
    handleGen();

    return () => {
      genBtn.removeEventListener('click', handleGen);
      copyBtn.removeEventListener('click', handleCopy);
    };
  },
};

export default PasswordTool;
