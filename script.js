let currentIdx = 0;
const slides = document.querySelectorAll('.page-slide');
const dockBtns = document.querySelectorAll('.dock-btn');
const hintEl = document.getElementById('scroll-hint');
const totalSlides = slides.length;

// 页面进入/退出时的元素级联浮现动画
function refreshStagger(slidesList) {
  slidesList.forEach((slide) => {
    const items = slide.querySelectorAll('.section-head, .hero-avatar-wrap, .hero-title, .hero-sub, .glass-box, .tags-row, .lotus-frame, .tarot-flip-wrap, .birds-banner');
    items.forEach((el, i) => {
      el.style.transitionDelay = '';
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  });
}
refreshStagger(slides);

function goToSlide(newIdx) {
  if (newIdx < 0 || newIdx >= totalSlides || newIdx === currentIdx) return;
  slides[currentIdx].classList.remove('active');
  dockBtns[currentIdx].classList.remove('active');
  currentIdx = newIdx;
  slides[currentIdx].classList.add('active');
  dockBtns[currentIdx].classList.add('active');
  hintEl.style.opacity = (currentIdx === totalSlides - 1) ? '0' : '0.6';
}

// 键盘方向键支持（桌面端）
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
    if (currentIdx < totalSlides - 1) goToSlide(currentIdx + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
    if (currentIdx > 0) goToSlide(currentIdx - 1);
  }
});

let startY = 0;
let startX = 0;
let startAtTop = true;
let startAtBottom = true;

function slideScrollState(slide) {
  const scrollable = slide.scrollHeight > slide.clientHeight + 1;
  return {
    scrollable,
    atTop: slide.scrollTop <= 0,
    atBottom: slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 1
  };
}

function inScrollableOverlay(target) {
  return target.closest && target.closest('.gallery-overlay, .draw-overlay, .gallery-viewer');
}

window.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
  startX = e.touches[0].clientX;
  const st = slideScrollState(slides[currentIdx]);
  startAtTop = st.atTop;
  startAtBottom = st.atBottom;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (inScrollableOverlay(e.target)) return;
  const dy = startY - e.changedTouches[0].clientY;
  const dx = startX - e.changedTouches[0].clientX;
  if (Math.abs(dy) > 45 && Math.abs(dy) > Math.abs(dx)) {
    // 页内内容还能往该方向滚动时优先滚内容，到边后才翻页
    if (dy > 0 && currentIdx < totalSlides - 1) {
      if (!startAtBottom) return;
      goToSlide(currentIdx + 1);
    } else if (dy < 0 && currentIdx > 0) {
      if (!startAtTop) return;
      goToSlide(currentIdx - 1);
    }
  }
}, { passive: true });

let wheelCooldown = false;
window.addEventListener('wheel', (e) => {
  if (wheelCooldown) return;
  if (inScrollableOverlay(e.target)) return;
  const st = slideScrollState(slides[currentIdx]);
  if (st.scrollable) {
    if (e.deltaY > 0 && !st.atBottom) return;
    if (e.deltaY < 0 && !st.atTop) return;
  }
  if (Math.abs(e.deltaY) > 25) {
    wheelCooldown = true;
    if (e.deltaY > 0 && currentIdx < totalSlides - 1) {
      goToSlide(currentIdx + 1);
    } else if (e.deltaY < 0 && currentIdx > 0) {
      goToSlide(currentIdx - 1);
    }
    setTimeout(() => { wheelCooldown = false; }, 600);
  }
}, { passive: true });

// 常驻细雨 Canvas 特效
const rainCanvas = document.getElementById('rain-canvas');
const rCtx = rainCanvas.getContext('2d');
let rW, rH;
function resizeRain() {
  rW = rainCanvas.width = window.innerWidth;
  rH = rainCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeRain);
resizeRain();

class RainDrop {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * (rW + 100) - 50;
    this.y = Math.random() * -rH;
    this.length = Math.random() * 22 + 12;
    this.speed = Math.random() * 4 + 3.5;
    this.wind = 0.8;
    this.alpha = Math.random() * 0.28 + 0.12;
  }
  update() {
    this.y += this.speed;
    this.x += this.wind;
    if (this.y > rH) { this.reset(); }
  }
  draw() {
    // 越靠下的雨丝越淡，模拟景深层次
    const depth = Math.min(this.y / rH, 1);
    const fade = this.alpha * (1 - depth * 0.55);
    rCtx.beginPath();
    rCtx.moveTo(this.x, this.y);
    rCtx.lineTo(this.x + this.wind * 1.5, this.y + this.length);
    rCtx.strokeStyle = `rgba(208, 212, 218, ${Math.max(fade, 0.02)})`;
    rCtx.lineWidth = 1;
    rCtx.lineCap = 'round';
    rCtx.stroke();
  }
}
const rainDrops = [];
for (let i = 0; i < 65; i++) { rainDrops.push(new RainDrop()); }
function renderRain() {
  rCtx.clearRect(0, 0, rW, rH);
  for (let i = 0; i < rainDrops.length; i++) {
    rainDrops[i].update();
    rainDrops[i].draw();
  }
  requestAnimationFrame(renderRain);
}
renderRain();

// 点击白色波纹与星屑
const clickCanvas = document.getElementById('click-canvas');
const cCtx = clickCanvas.getContext('2d');
let ripples = [];
function resizeClick() {
  clickCanvas.width = window.innerWidth;
  clickCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeClick);
resizeClick();

class WhiteRipple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 2;
    this.maxRadius = Math.random() * 28 + 42;
    this.alpha = 0.9;
    this.growRate = 2.2;
    this.sparks = [];
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 2.8 + 1.2;
      this.sparks.push({
        x: this.x, y: this.y,
        vx: Math.cos(angle) * dist,
        vy: Math.sin(angle) * dist,
        size: Math.random() * 2 + 1,
        alpha: 1
      });
    }
  }
  update() {
    this.radius += this.growRate;
    this.alpha -= 0.022;
    this.sparks.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.028;
    });
  }
  draw() {
    if (this.alpha > 0) {
      cCtx.beginPath();
      cCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      cCtx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
      cCtx.lineWidth = 1.6;
      cCtx.stroke();
      cCtx.beginPath();
      cCtx.arc(this.x, this.y, this.radius * 0.35, 0, Math.PI * 2);
      cCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.2})`;
      cCtx.fill();
    }
    this.sparks.forEach(s => {
      if (s.alpha > 0) {
        cCtx.beginPath();
        cCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        cCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        cCtx.shadowColor = '#ffffff';
        cCtx.shadowBlur = 6;
        cCtx.fill();
        cCtx.shadowBlur = 0;
      }
    });
  }
}
function spawnRipple(x, y) { ripples.push(new WhiteRipple(x, y)); }
window.addEventListener('click', (e) => spawnRipple(e.clientX, e.clientY));
window.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) spawnRipple(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

function renderRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].draw();
    if (ripples[i].alpha <= 0) ripples.splice(i, 1);
  }
}

/* ==========================================
   交互特效 1：桌面端鼠标星尘拖尾
   ========================================== */
const isTouchDevice = 'ontouchstart' in window;
const stardust = [];
if (!isTouchDevice) {
  window.addEventListener('mousemove', (e) => {
    if (Math.random() < 0.5) {
      stardust.push({
        x: e.clientX + (Math.random() - 0.5) * 8,
        y: e.clientY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.5 - 0.15,
        size: Math.random() * 2 + 0.6,
        alpha: 0.75,
        decay: 0.02
      });
    }
  });
}

/* ==========================================
   交互特效 2：双击 / 双触 爱心绽放 + 随机诗签
   ========================================== */
const loveQuotes = [
  '沉溺',
  '眷恋',
  '抽离',
  '羁绊'
];
const hearts = [];
const quoteLabels = [];

function spawnHeartBurst(x, y) {
  for (let i = 0; i < 9; i++) {
    const angle = (Math.PI * 2 / 9) * i + Math.random() * 0.4;
    const speed = Math.random() * 2.2 + 1.4;
    hearts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      size: Math.random() * 7 + 7,
      alpha: 1,
      decay: 0.012 + Math.random() * 0.008,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      hue: 200 + Math.random() * 25
    });
  }
  const quote = loveQuotes[Math.floor(Math.random() * loveQuotes.length)];
  quoteLabels.push({ x, y: y - 30, text: quote, alpha: 1 });
}

function drawHeart(ctx, x, y, size, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(size / 30, size / 30);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-22, -8, -12, -24, 0, -12);
  ctx.bezierCurveTo(12, -24, 22, -8, 0, 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

// 双触（移动端）检测
let lastTapTime = 0;
let lastTapX = 0, lastTapY = 0;
window.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0];
  const now = Date.now();
  if (now - lastTapTime < 320 && Math.abs(t.clientX - lastTapX) < 60 && Math.abs(t.clientY - lastTapY) < 60) {
    spawnHeartBurst(t.clientX, t.clientY);
    lastTapTime = 0;
  } else {
    lastTapTime = now;
    lastTapX = t.clientX;
    lastTapY = t.clientY;
  }
}, { passive: true });
window.addEventListener('dblclick', (e) => spawnHeartBurst(e.clientX, e.clientY));

/* ==========================================
   交互特效 3：环境音（雨声 + 偶发风铃）开关
   使用 Web Audio API 程序化生成，无需外部音频文件
   ========================================== */
let audioCtx = null;
let rainAudioNodes = null;
let soundOn = false;

function toggleAmbientSound() {
  const btn = document.getElementById('sound-toggle');
  if (!soundOn) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    buildRainSound();
    soundOn = true;
    if (btn) btn.classList.add('on');
  } else {
    if (rainAudioNodes) {
      rainAudioNodes.master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      const nodes = rainAudioNodes;
      setTimeout(() => { try { nodes.src.stop(); } catch (err) {} }, 900);
      rainAudioNodes = null;
    }
    soundOn = false;
    if (btn) btn.classList.remove('on');
  }
}

function buildRainSound() {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 350;

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 950;
  lowpass.Q.value = 0.6;

  const master = audioCtx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.11, audioCtx.currentTime + 1.5);

  src.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(master);
  master.connect(audioCtx.destination);
  src.start();

  rainAudioNodes = { src, master };
  scheduleChime();
}

function scheduleChime() {
  if (!soundOn) return;
  const delay = 6000 + Math.random() * 10000;
  setTimeout(() => {
    if (!soundOn || !audioCtx) return;
    const freq = [523.25, 587.33, 659.25, 783.99, 880][Math.floor(Math.random() * 5)];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 3.2);
    scheduleChime();
  }, delay);
}

const soundBtn = document.getElementById('sound-toggle');
if (soundBtn) soundBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleAmbientSound(); });

/* ==========================================
   交互特效 4：蝴蝶召唤（移动端点击屏幕，蝴蝶飞向指尖）
   ========================================== */
const butterflyEl = document.querySelector('.flying-butterfly');
let butterflySummoned = false;
if (butterflyEl) {
  window.addEventListener('click', (e) => {
    if (butterflySummoned) return;
    butterflySummoned = true;
    const rect = butterflyEl.getBoundingClientRect();
    butterflyEl.style.animation = 'none';
    butterflyEl.style.transition = 'left 1.8s cubic-bezier(0.3, 0.8, 0.4, 1), top 1.8s cubic-bezier(0.3, 0.8, 0.4, 1)';
    butterflyEl.style.left = rect.left + 'px';
    butterflyEl.style.top = rect.top + 'px';
    butterflyEl.style.opacity = '0.85';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        butterflyEl.style.left = (e.clientX - 31) + 'px';
        butterflyEl.style.top = (e.clientY - 24) + 'px';
      });
    });
    setTimeout(() => {
      butterflyEl.style.transition = 'opacity 1.2s ease';
      butterflyEl.style.opacity = '0';
      setTimeout(() => {
        butterflyEl.style.transition = '';
        butterflyEl.style.left = '';
        butterflyEl.style.top = '';
        butterflyEl.style.animation = '';
        butterflyEl.style.opacity = '';
        butterflySummoned = false;
      }, 1300);
    }, 2600);
  });
}

/* ==========================================
   交互特效 5：风格页关键词胶囊点选高亮
   ========================================== */
document.querySelectorAll('.tone-chip').forEach((chip) => {
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    chip.classList.toggle('lit');
  });
});

/* ==========================================
   交互特效 6：莲花卡 3D 倾斜 + 鼠标跟随扫光
   桌面端跟随鼠标，移动端跟随陀螺仪
   ========================================== */
const lotusCard = document.getElementById('lotus-card');
const lotusInner = lotusCard ? lotusCard.querySelector('.lotus-inner') : null;
const lotusShine = document.getElementById('lotus-shine');

let lotusTargetRX = 0, lotusTargetRY = 0;
let lotusCurRX = 0, lotusCurRY = 0;
let lotusTargetShineX = 30, lotusTargetShineAlpha = 0;
let lotusCurShineX = 30, lotusCurShineAlpha = 0;

function updateLotusFrame() {
  if (lotusInner) {
    lotusCurRX += (lotusTargetRX - lotusCurRX) * 0.12;
    lotusCurRY += (lotusTargetRY - lotusCurRY) * 0.12;
    lotusInner.style.transform =
      `rotateX(${lotusCurRX.toFixed(2)}deg) rotateY(${lotusCurRY.toFixed(2)}deg)`;
  }
  if (lotusShine) {
    lotusCurShineX += (lotusTargetShineX - lotusCurShineX) * 0.16;
    lotusCurShineAlpha += (lotusTargetShineAlpha - lotusCurShineAlpha) * 0.12;
    lotusShine.style.left = lotusCurShineX.toFixed(1) + '%';
    lotusShine.style.opacity = lotusCurShineAlpha.toFixed(2);
  }
  requestAnimationFrame(updateLotusFrame);
}

function lotusPointer(nx, ny) {
  // nx, ny 均为 -1 ~ 1 的归一化坐标
  lotusTargetRY = nx * 9;   // 左右倾斜
  lotusTargetRX = -ny * 7;  // 上下倾斜
  // 扫光跟随：水平位置映射到 5% ~ 95%
  lotusTargetShineX = 5 + ((nx + 1) / 2) * 90;
  lotusTargetShineAlpha = 0.85;
}

if (lotusCard) {
  if (!isTouchDevice) {
    // 桌面端：鼠标在整页范围内即可驱动（以卡片为中心计算方向）
    window.addEventListener('mousemove', (e) => {
      const rect = lotusCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxDist = 380;
      let dx = (e.clientX - cx) / maxDist;
      let dy = (e.clientY - cy) / maxDist;
      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));
      lotusPointer(dx, dy);
    });
    window.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) {
        lotusTargetRX = 0; lotusTargetRY = 0;
        lotusTargetShineAlpha = 0;
      }
    });
  } else {
    // 移动端：陀螺仪驱动（设备倾斜 = 卡片倾斜）
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma === null || e.beta === null) return;
      const gx = Math.max(-1, Math.min(1, e.gamma / 30));
      const gy = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      lotusPointer(gx, gy);
    });
  }
}
updateLotusFrame();

/* ==========================================
   交互特效 7：设备自动识别（电脑端横屏布局 / 手机端竖屏布局）
   + 手动横竖屏切换按钮（优先级高于自动识别）
   ========================================== */let layoutManualOverride = null; // null = 自动；true = 强制横屏；false = 强制竖屏

function applyDeviceMode() {
  const autoPC = !isTouchDevice && window.innerWidth >= 760;
  const isPC = layoutManualOverride === null ? autoPC : layoutManualOverride;
  document.body.classList.toggle('pc-mode', isPC);
  const ltBtn = document.getElementById('layout-toggle');
  if (ltBtn) {
    ltBtn.title = isPC ? '切换为竖屏布局' : '切换为横屏布局';
    ltBtn.setAttribute('aria-label', ltBtn.title);
  }
}
applyDeviceMode();
window.addEventListener('resize', applyDeviceMode);

const layoutToggle = document.getElementById('layout-toggle');
if (layoutToggle) {
  layoutToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    layoutManualOverride = !document.body.classList.contains('pc-mode');
    applyDeviceMode();
  });
}

/* ==========================================
   统一渲染循环：涟漪 / 星尘 / 爱心 / 诗签
   ========================================== */
function renderExtras() {
  cCtx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);

  renderRipples();

  // 星尘拖尾
  for (let i = stardust.length - 1; i >= 0; i--) {
    const s = stardust[i];
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= s.decay;
    if (s.alpha <= 0) { stardust.splice(i, 1); continue; }
    cCtx.beginPath();
    cCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    cCtx.fillStyle = `rgba(214, 217, 221, ${s.alpha})`;
    cCtx.shadowColor = 'rgba(168, 174, 182, 0.8)';
    cCtx.shadowBlur = 5;
    cCtx.fill();
    cCtx.shadowBlur = 0;
  }

  // 爱心粒子
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.x += h.vx;
    h.y += h.vy;
    h.vy += 0.035;
    h.rot += h.rotSpeed;
    h.alpha -= h.decay;
    if (h.alpha <= 0) { hearts.splice(i, 1); continue; }
    drawHeart(cCtx, h.x, h.y, h.size, h.rot, `hsla(${h.hue}, 85%, 72%, ${h.alpha})`);
  }

  // 诗签文字上浮
  for (let i = quoteLabels.length - 1; i >= 0; i--) {
    const q = quoteLabels[i];
    q.y -= 0.55;
    q.alpha -= 0.008;
    if (q.alpha <= 0) { quoteLabels.splice(i, 1); continue; }
    cCtx.font = '500 15px "Noto Serif SC", serif';
    cCtx.textAlign = 'center';
    cCtx.fillStyle = `rgba(244, 246, 248, ${q.alpha})`;
    cCtx.shadowColor = 'rgba(150, 158, 168, 0.8)';
    cCtx.shadowBlur = 12;
    cCtx.fillText(q.text, q.x, q.y);
    cCtx.shadowBlur = 0;
  }

  requestAnimationFrame(renderExtras);
}
renderExtras();

/* ==========================================
   交互特效 8：归程页·抽牌签文互动
   五张背面小牌扇形排开，点击翻开谶语弹卡，
   附风铃音效、抽牌历史与「再抽一次」重洗
   ========================================== */
const TAROT_DECK = [
  { name: '恋人', en: 'THE LOVERS', sym: '❦', kw: '心动 · 双向奔赴', verse: '牌面微亮：你惦记的那个人，此刻也在惦记你。雨停之前，会有回音。' },
  { name: '月亮', en: 'THE MOON', sym: '☾', kw: '不安 · 潮汐', verse: '今晚的月亮泡在水里。有些话不必急着说破，潮水会替你带到。' },
  { name: '星星', en: 'THE STAR', sym: '✦', kw: '愿望 · 微光', verse: '把愿望折小一点，放进雨云的口袋。它会在你忘记的时候悄悄实现。' },
  { name: '雨', en: 'THE RAIN', sym: '☂', kw: '倾诉 · 洗涤', verse: '这场雨是替你哭的。哭完之后，路面会映出星星。' },
  { name: '蝶', en: 'THE BUTTERFLY', sym: '✵', kw: '蜕变 · 轻盈', verse: '翅膀湿了也要飞。你现在经历的一切，都在把重量变成风。' },
  { name: '命运之轮', en: 'WHEEL OF FORTUNE', sym: '⌾', kw: '流转 · 时机', verse: '轮子转到了低处，别怕——从这里开始，每一步都是向上。' },
  { name: '隐士', en: 'THE HERMIT', sym: '◉', kw: '独处 · 灯火', verse: '提灯的人不急。你需要的答案，要一个人安静地走过去拿。' },
  { name: '塔', en: 'THE TOWER', sym: '⚡', kw: '推翻 · 重建', verse: '有些东西塌了，是因为它本来就不该站着。废墟之后，地基更稳。' },
  { name: '太阳', en: 'THE SUN', sym: '☀', kw: '坦荡 · 温度', verse: '今天的你是晴的。有人靠你这束光取暖，请继续明亮。' },
  { name: '水', en: 'THE WATER', sym: '≈', kw: '柔软 · 包容', verse: '水从不与石头争辩，只是日复一日，把它抱成圆润的样子。' }
];

const drawPool = document.getElementById('draw-pool');
const drawOverlay = document.getElementById('draw-overlay');
const drawHistory = document.getElementById('draw-history');
let drawCount = 0;

// 抽牌专属风铃（利用点击手势合法创建 AudioContext，不依赖雨声开关）
function playDrawChime() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [659.25, 987.77];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = audioCtx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.07, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 2.2);
    });
  } catch (err) { /* 音频不可用时静默降级 */ }
}

// 洗牌：从 10 张里随机取 5 张排入签池
function buildDrawPool() {
  if (!drawPool) return;
  const shuffled = TAROT_DECK.slice().sort(() => Math.random() - 0.5).slice(0, 5);
  drawPool.innerHTML = '';
  shuffled.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'draw-card';
    el.innerHTML =
      '<div class="draw-card-inner">' +
      '<div class="dc-face dc-back"></div>' +
      '<div class="dc-face dc-front"><span>' + card.sym + '</span><span class="dc-mini-kw">' + card.name + '</span></div>' +
      '</div>';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (el.classList.contains('open')) return;
      el.classList.add('open');
      playDrawChime();
      setTimeout(() => revealDrawCard(card), 420);
    });
    drawPool.appendChild(el);
  });
}

function revealDrawCard(card) {
  if (!drawOverlay) return;
  document.getElementById('dm-sym').textContent = card.sym;
  document.getElementById('dm-name').textContent = card.name;
  document.getElementById('dm-en').textContent = card.en;
  document.getElementById('dm-verse').textContent = '“' + card.verse + '”';
  document.getElementById('dm-kw').textContent = card.kw;
  drawOverlay.classList.add('show');
  drawCount++;
  if (drawHistory) {
    const chip = document.createElement('span');
    chip.className = 'dh-chip';
    chip.textContent = '第' + drawCount + '签 · ' + card.name;
    drawHistory.appendChild(chip);
  }
}

function closeDrawOverlay(reshuffle) {
  if (!drawOverlay) return;
  drawOverlay.classList.remove('show');
  if (reshuffle) setTimeout(buildDrawPool, 350);
}

if (drawOverlay) {
  document.getElementById('dm-keep').addEventListener('click', (e) => { e.stopPropagation(); closeDrawOverlay(false); });
  document.getElementById('dm-redraw').addEventListener('click', (e) => { e.stopPropagation(); closeDrawOverlay(true); });
  drawOverlay.addEventListener('click', (e) => { if (e.target === drawOverlay) closeDrawOverlay(false); });
}
buildDrawPool();
// ============ 赴约信息表（替代塔罗/抽签） ============
(function () {
  // 多选芯片
  document.querySelectorAll('.mf-chips').forEach(group => {
    group.querySelectorAll('.mf-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (group.classList.contains('mf-single')) {
          group.querySelectorAll('.mf-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
        } else {
          chip.classList.toggle('selected');
        }
      });
    });
  });

  const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const getChips = (id) => {
    const g = document.getElementById(id);
    if (!g) return [];
    return [...g.querySelectorAll('.mf-chip.selected')].map(c => c.textContent.trim());
  };

  const formEl = document.getElementById('meet-form');
  const sumEl = document.getElementById('mf-summary');

  document.getElementById('mf-done').addEventListener('click', (e) => {
    e.stopPropagation();
    const rows = [
      ['风格喜好', getChips('mf-styles').join(' / ') || '—'],
      ['备注/称呼', getVal('mf-call') || '—'],
      ['性别', getVal('mf-gender') || '—'],
      ['年龄', getVal('mf-age') || '—'],
      ['喜点', getVal('mf-like') || '—'],
      ['雷点', getVal('mf-hate') || '—'],
      ['是否接受擦', getChips('mf-rub').join(' / ') || '—'],
      ['是否新手板', getChips('mf-newbie').join(' / ') || '—'],
      ['备注', getVal('mf-note') || '—']
    ];
    const body = document.getElementById('mf-sum-body');
    body.innerHTML = '';
    rows.forEach(([k, v]) => {
      const row = document.createElement('div');
      row.className = 'mf-sum-row';
      const key = document.createElement('span');
      key.className = 'mf-sum-key';
      key.textContent = '· ' + k + '：';
      const val = document.createElement('span');
      val.className = 'mf-sum-val';
      val.textContent = v;
      row.appendChild(key); row.appendChild(val);
      body.appendChild(row);
    });
    formEl.style.display = 'none';
    sumEl.style.display = 'flex';
    sumEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('mf-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    sumEl.style.display = 'none';
    formEl.style.display = 'flex';
    formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

// ============ 二级图库页：全部老板点评 ============
(function () {
  const galleryOverlay = document.getElementById('gallery-overlay');
  const galleryGrid = document.getElementById('gallery-grid');
  const viewer = document.getElementById('gallery-viewer');
  const viewerImg = document.getElementById('gallery-viewer-img');
  const viewerCap = document.getElementById('gallery-viewer-cap');
  const openBtn = document.getElementById('mf-gallery-open');
  const closeBtn = document.getElementById('gallery-close');
  if (!galleryOverlay || !galleryGrid) return;

  const count = 45;
  const pngSet = [39, 42, 43, 45];
  let built = false;

  function buildGallery() {
    if (built) return;
    built = true;
    for (let n = 1; n <= count; n++) {
      const ext = pngSet.includes(n) ? '.png' : '.jpg';
      const src = '老板点评.' + n + ext;
      const item = document.createElement('div');
      item.className = 'g-item';
      const img = document.createElement('img');
      img.src = src;
      img.loading = 'lazy';
      img.alt = '老板点评 ' + n;
      const cap = document.createElement('div');
      cap.className = 'g-cap';
      cap.textContent = '第 ' + n + ' 则';
      item.appendChild(img);
      item.appendChild(cap);
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        viewerImg.src = src;
        viewerCap.textContent = '老板点评 · 第 ' + n + ' 则 / 共 ' + count + ' 则 · 点击任意处关闭';
        viewer.classList.add('open');
      });
      galleryGrid.appendChild(item);
    }
  }

  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    buildGallery();
    galleryOverlay.classList.add('open');
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    galleryOverlay.classList.remove('open');
  });
  galleryOverlay.addEventListener('click', (e) => {
    if (e.target === galleryOverlay) galleryOverlay.classList.remove('open');
  });
  viewer.addEventListener('click', () => viewer.classList.remove('open'));
})();

// ============ 老板点评翻牌（备用，当前页面未启用） ============
const bossReviewCount = 45;
const bossReviewPng = [39, 42, 43, 45]; // 其余均为 .jpg
let lastBossIdx = -1;
function flipBossCard(el) {
  el.classList.toggle('flipped');
  if (el.classList.contains('flipped')) {
    let idx;
    do { idx = Math.floor(Math.random() * bossReviewCount); }
    while (idx === lastBossIdx && bossReviewCount > 1);
    lastBossIdx = idx;
    const n = idx + 1;
    const ext = bossReviewPng.includes(n) ? '.png' : '.jpg';
    const img = document.getElementById('boss-review-img');
    const cap = document.getElementById('boss-review-cap');
    if (img) img.src = '老板点评.' + n + ext;
    if (cap) cap.textContent = '老板点评 · 第 ' + n + ' 则 / 共 ' + bossReviewCount + ' 则';
  }
}

// ============ 背景音乐（Écoute Chérie）· 进入页面自动播放 ============
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
if (bgMusic && musicBtn) {
  let musicFade = null;
  let musicStarted = false;

  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    bgMusic.volume = 0;
    musicBtn.classList.add('on');
    bgMusic.play().then(() => {
      musicFade = setInterval(() => {
        if (bgMusic.volume < 0.55) bgMusic.volume = Math.min(0.55, bgMusic.volume + 0.05);
        else clearInterval(musicFade);
      }, 200);
    }).catch(() => { musicStarted = false; });
  }

  function stopMusic() {
    musicStarted = false;
    musicBtn.classList.remove('on');
    clearInterval(musicFade);
    musicFade = setInterval(() => {
      if (bgMusic.volume > 0.05) bgMusic.volume -= 0.05;
      else { clearInterval(musicFade); bgMusic.pause(); bgMusic.volume = 0; }
    }, 100);
  }

  // 浏览器禁止无交互自动出声：先尝试直接播，被拦截则等第一次点击/触摸/按键时自动播
  startMusic();
  const gestureStart = () => {
    startMusic();
    window.removeEventListener('pointerdown', gestureStart);
    window.removeEventListener('keydown', gestureStart);
  };
  window.addEventListener('pointerdown', gestureStart);
  window.addEventListener('keydown', gestureStart);

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (bgMusic.paused) startMusic();
    else stopMusic();
  });
}