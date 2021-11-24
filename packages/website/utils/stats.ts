import Stats from 'stats.js';

let stats: null | Stats = null;
let rafId: number;

export function enable() {
  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  function animate() {
    stats?.begin();
    stats?.end();
    rafId = requestAnimationFrame(animate);
  }
  animate();
}

export function disable() {
  cancelAnimationFrame(rafId);
  stats && document.body.removeChild(stats.dom);
  stats = null;
}
