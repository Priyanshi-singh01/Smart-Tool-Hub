export const PercentageTool = {
  id: 'percentage',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-row">
        <div class="t-field"><label for="p-total">Total number</label><input id="p-total" type="number"></div>
        <div class="t-field"><label for="p-part">Part / obtained</label><input id="p-part" type="number"></div>
      </div>
      <button class="t-btn" id="p-calc" type="button">Calculate</button>
      <div class="t-result" id="p-result" hidden></div>
    `;

    const totalEl = container.querySelector('#p-total');
    const partEl = container.querySelector('#p-part');
    const resultEl = container.querySelector('#p-result');
    const btn = container.querySelector('#p-calc');

    const handleCalc = () => {
      const total = parseFloat(totalEl.value);
      const part = parseFloat(partEl.value);
      resultEl.hidden = false;
      if (!total || isNaN(total) || isNaN(part)) {
        resultEl.textContent = 'Kripya sahi sankhya bharein.';
        return;
      }
      const pct = (part / total) * 100;
      resultEl.textContent = `${part} out of ${total} = ${pct.toFixed(2)}%`;
    };

    btn.addEventListener('click', handleCalc);

    return () => {
      btn.removeEventListener('click', handleCalc);
    };
  },
};

export default PercentageTool;
