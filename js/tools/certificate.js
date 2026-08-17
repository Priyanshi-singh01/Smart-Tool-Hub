export const CertificateTool = {
  id: 'certificate',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-row">
        <div class="t-field"><label for="c-student">Student name</label><input id="c-student" placeholder="Student Name"></div>
        <div class="t-field"><label for="c-course">Course name</label><input id="c-course" placeholder="Course Name"></div>
      </div>
      <div class="t-field"><label for="c-org">Organization / institute</label><input id="c-org" placeholder="Organization"></div>
      <button class="t-btn" id="c-preview" type="button">Create Preview</button>
      <div id="c-output" class="t-preview" style="text-align:center;display:none"></div>
    `;

    const studentEl = container.querySelector('#c-student');
    const courseEl = container.querySelector('#c-course');
    const orgEl = container.querySelector('#c-org');
    const btn = container.querySelector('#c-preview');
    const output = container.querySelector('#c-output');

    function el(tag, text, styles) {
      const node = document.createElement(tag);
      node.textContent = text; // textContent, never innerHTML, for user input
      if (styles) Object.assign(node.style, styles);
      return node;
    }

    const handlePreview = () => {
      output.innerHTML = '';
      output.style.display = 'block';
      output.appendChild(el('h1', '🏆 CERTIFICATE'));
      output.appendChild(el('p', 'This is proudly presented to'));
      output.appendChild(el('h2', studentEl.value.trim() || 'Student Name'));
      output.appendChild(el('p', 'for successfully completing'));
      output.appendChild(el('h3', courseEl.value.trim() || 'Course Name'));
      output.appendChild(el('p', orgEl.value.trim() || 'Organization'));
      const line = document.createElement('div');
      line.textContent = '__________________';
      output.appendChild(line);
      output.appendChild(el('p', 'Authorized Signature'));
    };

    btn.addEventListener('click', handlePreview);

    return () => {
      btn.removeEventListener('click', handlePreview);
    };
  },
};

export default CertificateTool;
