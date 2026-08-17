function makeRow(n) {
  const row = document.createElement('div');
  row.className = 't-row';
  row.dataset.row = n;
  row.innerHTML = `
    <div class="t-field"><label>Subject ${n} — Grade point (0-10)</label><input type="number" min="0" max="10" step="0.1" class="cgpa-gp"></div>
    <div class="t-field"><label>Credits</label><input type="number" min="0" step="0.5" class="cgpa-credit"></div>
  `;
  return row;
}

export const CGPATool = {
  id: 'cgpa',

  async mount(container, context) {
    container.innerHTML = `
      <div id="cgpa-rows"></div>
      <button class="t-btn secondary" id="cgpa-add" type="button">+ Add Subject</button>
      <button class="t-btn" id="cgpa-calc" type="button">Calculate CGPA</button>
      <div class="t-result" id="cgpa-result" hidden></div>
    `;

    const rowsEl = container.querySelector('#cgpa-rows');
    const addBtn = container.querySelector('#cgpa-add');
    const calcBtn = container.querySelector('#cgpa-calc');
    const resultEl = container.querySelector('#cgpa-result');

    let count = 0;
    const addRow = () => {
      count += 1;
      rowsEl.appendChild(makeRow(count));
    };
    addRow();
    addRow();
    addRow();

    const handleCalc = () => {
      let totalCredits = 0;
      let totalPoints = 0;
      rowsEl.querySelectorAll('[data-row]').forEach((row) => {
        const gp = parseFloat(row.querySelector('.cgpa-gp').value);
        const credit = parseFloat(row.querySelector('.cgpa-credit').value);
        if (!isNaN(gp) && !isNaN(credit) && credit > 0) {
          totalCredits += credit;
          totalPoints += gp * credit;
        }
      });
      resultEl.hidden = false;
      if (totalCredits === 0) {
        resultEl.textContent = 'Kam se kam ek subject ke grade point aur credits bharein.';
        return;
      }
      resultEl.textContent = `CGPA: ${(totalPoints / totalCredits).toFixed(2)} (Total credits: ${totalCredits})`;
    };

    addBtn.addEventListener('click', addRow);
    calcBtn.addEventListener('click', handleCalc);

    return () => {
      addBtn.removeEventListener('click', addRow);
      calcBtn.removeEventListener('click', handleCalc);
    };
  },
};

export default CGPATool;
