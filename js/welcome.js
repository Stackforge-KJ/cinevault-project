// Full-screen welcome with a confetti show. Appears once each time the site is opened (per browser tab).
function confetti(canvas, isOpen) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = innerWidth, h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#ff1f4b", "#ffd166", "#06d6a0", "#4cc9f0", "#ffffff", "#c77dff"];
  const bits = [];
  const piece = (x, y, vx, vy, gravity, delay) => bits.push({
    x, y, vx, vy, gravity, delay, r: 5 + Math.random() * 7, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.45,
    c: colors[(Math.random() * colors.length) | 0], round: Math.random() < 0.3,
  });
  const power = Math.max(h / 800, 0.7);
  // Three volleys from both bottom corners
  for (let v = 0; v < 3; v++) {
    for (let i = 0; i < 80; i++) {
      const speed = (12 + Math.random() * 14) * power;
      const left = -1.45 + Math.random() * 0.85;         // up and to the right
      const right = -Math.PI - left;                       // mirror: up and to the left
      piece(0, h, Math.cos(left) * speed, Math.sin(left) * speed, 0.3, v * 40 + Math.random() * 10);
      piece(w, h, Math.cos(right) * speed, Math.sin(right) * speed, 0.3, v * 40 + Math.random() * 10);
    }
  }
  // Rain from the top
  for (let i = 0; i < 160; i++) piece(Math.random() * w, -20 - Math.random() * h, (Math.random() - 0.5) * 2, 2 + Math.random() * 4, 0.02, 0);

  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const b of bits) {
      if (b.delay-- > 0) { alive++; continue; }
      b.vy += b.gravity; b.vx *= 0.99; b.vy *= 0.99;
      b.x += b.vx; b.y += b.vy; b.a += b.va;
      if (b.y > h + 40) continue;
      alive++;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a);
      ctx.fillStyle = b.c;
      if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.r / 2, 0, 6.3); ctx.fill(); }
      else ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * 1.5);
      ctx.restore();
    }
    if (alive && ++frames < 700 && isOpen()) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, w, h);
  })();
}

export function showWelcome() {
  try { if (sessionStorage.getItem("cv_welcome")) return; sessionStorage.setItem("cv_welcome", "1"); } catch (e) { /* storage blocked: just show it */ }
  const dlg = document.createElement("dialog");
  dlg.className = "welcome";
  dlg.setAttribute("aria-labelledby", "welcome-title");
  dlg.innerHTML = `
    <canvas aria-hidden="true"></canvas>
    <div class="welcome-emoji" aria-hidden="true">&#127916;&#127871;</div>
    <h2 id="welcome-title">Welcome to<br>Cine<span>Vault</span></h2>
    <p class="welcome-by">by Stackforge_KJ</p>
    <p class="hint">Stream, download and keep your favourite movies in one place.</p>
    <button class="btn btn-primary" type="button" autofocus>Start watching</button>`;
  document.body.append(dlg);
  dlg.showModal();
  dlg.querySelector("button").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => dlg.remove());
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) confetti(dlg.querySelector("canvas"), () => dlg.open);
}
