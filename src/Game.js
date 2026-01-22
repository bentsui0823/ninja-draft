// src/Game.js
const INVALID_MOVE = 'INVALID_MOVE';
import { generateDeck, TYPES } from './database.js';

function calculateScore(hand) {
  let score = 0;
  const chars = hand.filter(c => c.type === TYPES.CHARACTER);
  const weapons = hand.filter(c => c.type === TYPES.WEAPON);
  const treasures = hand.filter(c => c.type === TYPES.TREASURE);
  const charIds = new Set(chars.map(c => c.id));

  if (charIds.has(19)) score += 1;

  const processedBonds = new Set();
  chars.forEach(c => {
    if (c.bondId && charIds.has(c.bondId)) {
      const pairId = c.id < c.bondId ? `${c.id}-${c.bondId}` : `${c.bondId}-${c.id}`;
      if (!processedBonds.has(pairId)) {
        score += 2;
        processedBonds.add(pairId);
      }
    }
  });

  const quadIds = [15, 16, 17, 18];
  if (quadIds.every(id => charIds.has(id))) score += 6;

  let setsCount = 0;
  treasures.forEach(t => { if (charIds.has(t.targetId)) setsCount++; });
  if (setsCount >= 6) score += 15;
  else if (setsCount >= 4) score += 9;
  else if (setsCount >= 2) score += 4;

  const cCount = chars.length;
  let reunionScore = cCount >= 15 ? 21 : cCount >= 12 ? 15 : cCount >= 8 ? 7 : 0;
  const wCount = weapons.length;
  let arsenalScore = wCount >= 15 ? 20 : wCount >= 12 ? 14 : wCount >= 8 ? 6 : 0;
  const tCount = treasures.length;
  let tycoonScore = tCount >= 15 ? 22 : tCount >= 12 ? 16 : tCount >= 8 ? 8 : 0;
  score += Math.max(reunionScore, arsenalScore, tycoonScore);

  const weaponCounts = {};
  weapons.forEach(w => { weaponCounts[w.element] = (weaponCounts[w.element] || 0) + 1; });
  Object.values(weaponCounts).forEach(count => {
    if (count >= 5) score += 7;
    else if (count === 4) score += 5;
    else if (count === 3) score += 2;
  });

  return score;
}

export const NinjaDraft = {
  name: 'ninja-draft',

  setup: ({ ctx, random }) => {
    const deck = random.Shuffle(generateDeck());
    const players = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      const hand = deck.splice(0, 6);
      players[i] = { 
        hand: hand, 
        score: calculateScore(hand), 
        ready: false, 
        mulliganPicks: [] 
      };
    }
    const firstPlayerId = String(random.Die(2) - 1);

    return {
      deck, field: [], players, 
      r1FirstPlayer: firstPlayerId,
      round: 0, pickOrder: [], pickIndex: 0
    };
  },

  phases: {
    mulligan: {
      start: true,
      next: 'draft',
      // 這裡設定 activePlayers 讓大家可以同時動作
      turn: { activePlayers: { all: 'mulligan' } },
      
      // ★★★ 修正點：將 moves 放回這裡，不要放在 stages 裡 ★★★
      moves: {
        toggleMulliganCard: ({ G, playerID }, index) => {
          const picks = G.players[playerID].mulliganPicks;
          const pos = picks.indexOf(index);
          pos > -1 ? picks.splice(pos, 1) : picks.push(index);
        },
        confirmMulligan: ({ G, playerID }) => { G.players[playerID].ready = true; }
      },

      endIf: ({ G }) => Object.values(G.players).every(p => p.ready),
      onEnd: ({ G, random, ctx }) => {
        const discarded = [];
        for (let i = 0; i < ctx.numPlayers; i++) {
          const p = G.players[i];
          p.mulliganPicks.sort((a,b)=>b-a).forEach(idx => {
            discarded.push(p.hand[idx]);
            p.hand.splice(idx, 1);
          });
          p.hand.push(...G.deck.splice(0, 6 - p.hand.length));
          p.ready = false; 
          p.mulliganPicks = [];
          p.score = calculateScore(p.hand);
        }
        G.deck = random.Shuffle([...G.deck, ...discarded]);
      }
    },
    
    draft: {
      onBegin: ({ G }) => {
        G.round++; 
        G.field = G.deck.splice(0, 10);
        const r1First = parseInt(G.r1FirstPlayer, 10);
        const fNum = (G.round === 1 || G.round === 4) ? r1First : 1 - r1First;
        const sNum = 1 - fNum;
        G.pickOrder = [String(fNum), String(sNum), String(sNum), String(fNum), String(fNum), String(sNum)];
        G.pickIndex = 0;
      },
      turn: {
        order: {
          first: ({ G }) => {
            const r1First = parseInt(G.r1FirstPlayer, 10);
            const currentRound = G.round; 
            return (currentRound === 1 || currentRound === 4) ? r1First : 1 - r1First;
          },
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers
        }
      },
      moves: {
        pickCard: ({ G, ctx, events, random }, idxOrArray) => {
          const indices = Array.isArray(idxOrArray) ? idxOrArray : [idxOrArray];
          for (let idx of indices) {
            if (!G.field[idx] || G.field[idx].taken) return INVALID_MOVE;
            const expectedPlayer = G.pickOrder[G.pickIndex];
            if (ctx.currentPlayer !== expectedPlayer) return INVALID_MOVE;
            const player = G.players[ctx.currentPlayer];
            const card = G.field[idx];
            card.taken = true;
            card.takenBy = ctx.currentPlayer;
            const cardForHand = { ...card };
            delete cardForHand.taken;
            delete cardForHand.takenBy;
            player.hand.push(cardForHand);
            player.score = calculateScore(player.hand);
            G.pickIndex++;
          }
          if (G.pickIndex >= 6) {
            if (G.round >= 4) { events.endGame(); } else { events.setPhase('intermission'); }
          } else {
            const nextPlayer = G.pickOrder[G.pickIndex];
            events.endTurn({ next: nextPlayer });
          }
        }
      },
    },

    intermission: {
      turn: { activePlayers: { all: 'intermissionStage' } },
      moves: {
        readyForNextRound: ({ G, playerID }) => {
          G.players[playerID].ready = true;
        }
      },
      endIf: ({ G }) => Object.values(G.players).every(p => p.ready),
      onEnd: ({ G, random }) => {
        Object.values(G.players).forEach(p => p.ready = false);
        const leftovers = G.field.filter(c => !c.taken);
        G.deck = random.Shuffle([...G.deck, ...leftovers]);
        G.field = [];
      },
      next: 'draft' 
    }
  }
};