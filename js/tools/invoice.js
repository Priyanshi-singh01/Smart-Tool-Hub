export const InvoiceTool = {
  id: 'invoice',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-field"><label for="i-buyer">Customer name</label><input id="i-buyer" placeholder="Customer Name"></div>
      <div class="t-field">
        <label for="i-items">Items — one per line: "Item - Amount"</label>
        <textarea id="i-items" rows="7" placeholder="Training - 5000&#10;Printing - 500"></textarea>
      </div>
      <button class="t-btn" id="i-build" type="button">Create Invoice</button>
      <div id="i-output" class="t-preview" style="display:none"></div>
    `;

    const buyerEl = container.querySelector('#i-buyer');
    const itemsEl = container.querySelector('#i-items');
    const btn = container.querySelector('#i-build');
    const output = container.querySelector('#i-output');

    const handleBuild = () => {
      output.innerHTML = '';
      output.style.display = 'block';

      const heading = document.createElement('h2');
      heading.textContent = 'INVOICE';
      output.appendChild(heading);

      const buyerLine = document.createElement('p');
      buyerLine.textContent = `Customer: ${buyerEl.value.trim() || '—'}`;
      output.appendChild(buyerLine);

      const table = document.createElement('table');
      table.width = '100%';
      table.border = '1';
      table.cellPadding = '8';

      const headRow = document.createElement('tr');
      ['Item', 'Amount'].forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
      });
      table.appendChild(headRow);

      let total = 0;
      const lines = itemsEl.value.split('\n').map((l) => l.trim()).filter(Boolean);
      lines.forEach((line) => {
        const idx = line.lastIndexOf('-');
        const name = idx > 0 ? line.slice(0, idx).trim() : line;
        const amtRaw = idx > 0 ? parseFloat(line.slice(idx + 1)) : 0;
        const amt = isNaN(amtRaw) ? 0 : amtRaw;
        total += amt;

        const row = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = name;
        const tdAmt = document.createElement('td');
        tdAmt.textContent = `₹${amt}`;
        row.appendChild(tdName);
        row.appendChild(tdAmt);
        table.appendChild(row);
      });

      const totalRow = document.createElement('tr');
      const thTotal = document.createElement('th');
      thTotal.textContent = 'Total';
      const thTotalAmt = document.createElement('th');
      thTotalAmt.textContent = `₹${total}`;
      totalRow.appendChild(thTotal);
      totalRow.appendChild(thTotalAmt);
      table.appendChild(totalRow);

      output.appendChild(table);
    };

    btn.addEventListener('click', handleBuild);

    return () => {
      btn.removeEventListener('click', handleBuild);
    };
  },
};

export default InvoiceTool;
