export const TextCounterTool = {
  id: 'text-counter',

  async mount(container, context) {
    container.innerHTML = `
      <div class="t-field">
        <textarea id="tc-input" rows="10" placeholder="Yahan apna text likhein…"></textarea>
      </div>
      <div class="t-result" id="tc-stats">Words: 0 · Characters: 0 · Reading time: 0 min</div>
    `;

    const input = container.querySelector('#tc-input');
    const stats = container.querySelector('#tc-stats');

    const update = () => {
      const text = input.value;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const charsNoSpace = text.replace(/\s/g, '').length;
      const minutes = Math.max(1, Math.round(words / 200));
      stats.textContent = `Words: ${words} · Characters: ${chars} (${charsNoSpace} without spaces) · Reading time: ~${words ? minutes : 0} min`;
    };

    input.addEventListener('input', update);
    update();

    return () => {
      input.removeEventListener('input', update);
    };
  },
};

export default TextCounterTool;
