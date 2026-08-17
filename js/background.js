/**
 * background.js — purely decorative canvas animation.
 * Renders slow-moving translucent ribbon waves behind everything
 * (z-index -1) so they only show through whitespace; cards/panels
 * have opaque backgrounds and sit visually on top.
 * Respects prefers-reduced-motion by rendering one static frame only.
 */

const TEAL = '28,158,116';   // matches --teal-500
const AMBER = '242,167,27';  // matches --amber-500

function initBackgroundFX() {
  const canvas = document.getElementById('bg-fx');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function drawRibbons() {
    ctx.clearRect(0, 0, width, height);
    [
      { color: TEAL, yBase: height * 0.32, amp: 60, speed: 0.6, alpha: 0.16 },
      { color: AMBER, yBase: height * 0.72, amp: 75, speed: 0.42, alpha: 0.14 },
    ].forEach(({ color, yBase, amp, speed, alpha }) => {
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= width; x += 20) {
        const y = yBase + Math.sin(x * 0.004 + t * speed) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.fill();
    });
  }

  if (reduceMotion) {
    drawRibbons(); // one static frame, no loop
    return;
  }

  let rafId;
  function loop() {
    t += 0.003; // slow, gentle drift — no flicker
    drawRibbons();
    rafId = requestAnimationFrame(loop);
  }
  loop();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else if (!reduceMotion) {
      loop();
    }
  });
}

initBackgroundFX();
