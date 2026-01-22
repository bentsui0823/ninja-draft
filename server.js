// server.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Server, Origins } = require('boardgame.io/server');
import { NinjaDraft } from './src/Game.js'; 

const server = Server({
  games: [NinjaDraft],
  origins: [
    // 1. 允許本機開發
    Origins.LOCALHOST,
    // 2. ★★★ 加入你的 Render 前端網址 (不帶斜線) ★★★
    "https://ninja-draft-client.onrender.com",
    // 3. 保留這行以防萬一
    "*"
  ],
});

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});