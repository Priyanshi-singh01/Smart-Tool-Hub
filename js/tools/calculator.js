const KEYS = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C','⌫'];

function safeEval(expr) {
  if (!/^[0-9+\-*/.\s]*$/.test(expr)) return 'Error';
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr || '0'})`)();
    if (!isFinite(result)) return 'Error';
    return String(result);
  } catch {
    return 'Error';
  }
}

export const CalculatorTool = {
  id: 'calculator',

  async mount(container, context) {
    container.innerHTML = `
      <div class="calc-tool">
        <div class="t-field">
          <input id="calc-display" readonly placeholder="0" style="font-size:22px;text-align:right;background:var(--canvas)">
        </div>
        <div class="t-keypad" id="calc-keys"></div>
      </div>
    `;

    const display = container.querySelector('#calc-display');
    const keysEl = container.querySelector('#calc-keys');

    KEYS.forEach((key) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 't-btn' + (key === '=' ? '' : ' secondary');
      btn.textContent = key;
      btn.dataset.key = key;
      keysEl.appendChild(btn);
    });

    const handleClick = (e) => {
      const btn = e.target.closest('button[data-key]');
      if (!btn) return;
      const key = btn.dataset.key;
      if (key === 'C') {
        display.value = '';
      } else if (key === '⌫') {
        display.value = display.value.slice(0, -1);
      } else if (key === '=') {
        display.value = safeEval(display.value);
      } else {
        display.value += key;
      }
    };

    const handleKeydown = (e) => {
      if (e.key === 'Enter') { display.value = safeEval(display.value); }
      else if (e.key === 'Backspace') { display.value = display.value.slice(0, -1); }
      else if (/^[0-9+\-*/.]$/.test(e.key)) { display.value += e.key; }
    };

    keysEl.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeydown);

    return () => {
      keysEl.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeydown);
    };
  },
};

export default CalculatorTool;
