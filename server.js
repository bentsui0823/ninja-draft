// server.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Server, Origins } = require('boardgame.io/server');
import { NinjaDraft } from './src/Game.js'; 

const server = Server({
  games: [NinjaDraft],
  origins: [
    // 允許 localhost 開發
    Origins.LOCALHOST,
    // ★★★ 重要：允許所有來源連線 (為了方便部署，先設為 *，正式上線建議改成你的前端網址) ★★★
    "*" 
  ],
});

// ★★★ 重要：讀取雲端分配的 PORT，如果沒有才用 8000 ★★★
const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});