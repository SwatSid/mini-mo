const socket  = io();               // 1️⃣  connect (auto‑uses same host:port)
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
resize();
window.addEventListener('resize', resize);

const nameInp = document.getElementById('name');
const shapeSel= document.getElementById('shape');
document.getElementById('go').onclick = joinGame;

let joined = false;     // add this near the top
let myId   = null;
const players = {};                 // state copy mirrored from server

/* === JOIN === */
function joinGame() {
  if (joined) return;   // only block *after* we joined
//   if (myId) return;                 // already in

  socket.emit('join', {
    name : nameInp.value || 'anon',
    shape: shapeSel.value
  });
  joined = true;
  document.getElementById('ui').style.display = 'none';   // hide the inputs
}
/* === NETWORK EVENTS === */
socket.on('connect', () => { myId = socket.id; });
socket.on('init',   (srvPlayers)    => Object.assign(players, srvPlayers));
socket.on('spawn',  (p)             => players[p.id] = p);
socket.on('despawn',(id)            => delete players[id]);
socket.on('state',  (srvPlayers)    => Object.assign(players, srvPlayers));

/* === INPUT === */
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup',   e => keys[e.key] = false);

/* === GAME LOOP === */
function tick() {
  if (myId && players[myId]) {
    const speed = 2;
    const p = players[myId];
    if (keys['ArrowUp']   || keys['w']) p.y -= speed;
    if (keys['ArrowDown'] || keys['s']) p.y += speed;
    if (keys['ArrowLeft'] || keys['a']) p.x -= speed;
    if (keys['ArrowRight']|| keys['d']) p.x += speed;

    // keep inside canvas bounds
    p.x = Math.max(0, Math.min(canvas.width,  p.x));
    p.y = Math.max(0, Math.min(canvas.height, p.y));

    socket.emit('move', { x: p.x, y: p.y });
  }

  draw();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* === RENDER === */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const id in players) {
    const p = players[id];
    ctx.fillStyle = id === myId ? '#007aff' : '#333';

    switch (p.shape) {
      case 'square':
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 12); ctx.lineTo(p.x + 12, p.y + 12); ctx.lineTo(p.x - 12, p.y + 12);
        ctx.closePath(); ctx.fill();
        break;
      default: // circle
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
    }

    // name tag
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, p.x, p.y - 18);
  }
}

/* === UTILS === */
function resize() {
  canvas.width  = innerWidth;
  canvas.height = innerHeight;
}
