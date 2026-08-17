/**
 * UPSDM ID Card Maker
 * This tool is a self-contained HTML app (its own head/body/script),
 * so instead of rewriting it against the shadow-DOM mount contract,
 * we load it as-is inside a sandboxed iframe. Nothing about the tool
 * itself changes — this file only makes the hub able to open it.
 */

export default {
  id: 'upsdm-id-card',
  mount(container, context) {
    const iframe = document.createElement('iframe');
    iframe.src = new URL('../../pages/upsdm-id-card.html', import.meta.url).href;
    iframe.title = 'UPSDM ID Card Maker';
    iframe.style.cssText = 'width:100%;height:82vh;border:0;display:block;background:#fff;border-radius:10px;';

    container.appendChild(iframe);

    // cleanup fn — called by the workspace shell when navigating away
    return () => {
      iframe.src = 'about:blank';
      iframe.remove();
    };
  },
};
