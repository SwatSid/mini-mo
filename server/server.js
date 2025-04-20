/*
 * Minimal Socket.IO + Express server
 * folder layout assumed:
 *  ├─ server/server.js   ← (this file)
 *  └─ public/            ← static files served to browser
 */

const path   = require('path');
const http   = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { /* you could tune CORS here */ });

// 1️⃣  Serve everything in /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// 2️⃣  In‑memory player registry (no DB, no persistence)
const players = {};

/* 3️⃣  Realtime handlers */
io.on('connection', (socket) => {
  console.log('🔌 client connected', socket.id);

  /* 3a. New player joins */
  socket.on('join', ({ name, shape }) => {
    players[socket.id] = { id: socket.id, name, shape, x: 100, y: 100 };
    socket.emit('init', players);          // send whole roster to newcomer
    socket.broadcast.emit('spawn', players[socket.id]); // tell others
  });

  /* 3b. Client sent movement intent */
  socket.on('move', ({ x, y }) => {
    if (players[socket.id]) {
      players[socket.id].x = x;
      players[socket.id].y = y;
    }
  });

  /* 3c. Client disconnects */
  socket.on('disconnect', () => {
    console.log('🚪 client left', socket.id);
    delete players[socket.id];
    io.emit('despawn', socket.id);
  });
});

/* 4️⃣  Broadcast authoritative state ~15 fps */
setInterval(() => io.emit('state', players), 1000 / 15);

/* 5️⃣  Boot */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✔️  Listening on http://localhost:${PORT}`));
