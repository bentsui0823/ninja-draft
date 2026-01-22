// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { NinjaDraft } from './Game';
import { cardDatabase } from './database';

const NinjaBoard = ({ G, ctx, moves, playerID, matchID, onLeave, displayName }) => {
  
  const [draftSelection, setDraftSelection] = useState([]);

  // --- CSS ---
  const css = `
    .game-container { padding: 20px; font-family: sans-serif; max-width: 1200px; margin: 0 auto; }
    .game-layout { display: flex; gap: 30px; align-items: flex-start; }
    .left-panel { flex: 0 0 640px; max-width: 100%; }
    .right-panel { flex: 1; min-width: 300px; position: sticky; top: 20px; }
    .info-two-col { display: grid; grid-template-columns: 1fr 1fr; column-gap: 10px; row-gap: 2px; }
    .card-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .taken-badge { position: absolute; top: 2px; right: 2px; background-color: rgba(50, 50, 50, 0.8); color: #fff; font-size: 10px; font-weight: bold; padding: 1px 5px; border-radius: 4px; z-index: 2; pointer-events: none; }
    .card-item { position: relative; }
    .confirm-btn { padding: 15px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px; font-size: 16px; transition: background 0.2s; }
    .confirm-btn:disabled { background-color: #ccc; cursor: not-allowed; color: #666; }
    .confirm-btn:not(:disabled) { background-color: #27ae60; color: white; box-shadow: 0 4px 0 #219150; }
    .confirm-btn:not(:disabled):active { transform: translateY(2px); box-shadow: 0 2px 0 #219150; }
    .wait-message { padding: 15px; background-color: #e0e0e0; border-radius: 8px; border: 1px solid #bdbdbd; text-align: center; margin-top: 15px; color: #616161; font-weight: bold; animation: pulse-gray 2s infinite; }
    .round-end-msg { padding: 15px; background-color: #e3f2fd; border-radius: 8px; border: 1px solid #2196f3; text-align: center; margin-top: 15px; color: #0d47a1; font-weight: bold; }
    .room-info { position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; z-index: 100; }
    @keyframes pulse-gray { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }
    @media (max-width: 1000px) { .game-layout { flex-direction: column; } .left-panel { flex: 1; width: 100%; } .right-panel { width: 100%; min-width: auto; } .info-two-col { grid-template-columns: 1fr; } .card-item { width: 30% !important; font-size: 12px !important; } }
  `;
  
  if (!G) return <div style={{textAlign:'center', marginTop:'50px'}}>正在載入遊戲資料...</div>;

  // Helper: 取得顯示名稱
  const getPlayerName = (id) => {
      const strID = String(id);
      let name = G.names && G.names[strID] ? G.names[strID] : `Player ${id}`;
      if (String(playerID) === strID && displayName && (name === `Player ${id}` || name === `Player ${strID}`)) {
          name = displayName;
      }
      return name;
  };

  // --- 1. 遊戲結束畫面 ---
  if (ctx.gameover) {
    const winner = ctx.gameover.winner;
    const isWinner = winner === playerID;
    const isDraw = winner === 'draw';

    const getFinalStats = (hand) => {
      const chars = hand.filter(c => c.type === 'character');
      const weapons = hand.filter(c => c.type === 'weapon');
      const treasures = hand.filter(c => c.type === 'treasure');
      const charIds = new Set(chars.map(c => c.id));
      const handIds = new Set(hand.map(c => c.id));
      const bonds = [];
      const processed = new Set();
      chars.forEach(c => {
        if (c.bondId && charIds.has(c.bondId)) {
          const id1 = c.id < c.bondId ? c.id : c.bondId;
          const id2 = c.id < c.bondId ? c.bondId : c.id;
          const pairKey = `${id1}-${id2}`;
          if (!processed.has(pairKey)) {
            processed.add(pairKey);
            const c1 = cardDatabase.find(x => x.id === id1);
            const c2 = cardDatabase.find(x => x.id === id2);
            bonds.push(`${c1.name.replace('人物-', '')} & ${c2.name.replace('人物-', '')}`);
          }
        }
      });
      const quadIds = [15, 16, 17, 18];
      const hasQuad = quadIds.every(id => charIds.has(id));
      const hasXuShi = charIds.has(19);
      let setsCount = 0;
      const setTreasures = cardDatabase.filter(c => c.type === 'treasure' && c.targetId);
      const setDetails = setTreasures.map(t => {
          const char = cardDatabase.find(c => c.id === t.targetId);
          const hasChar = handIds.has(char.id);
          const hasTreasure = handIds.has(t.id);
          if (hasTreasure && hasChar) setsCount++;
          return { charName: char.name.replace('人物-', ''), treasureName: t.name, hasChar, hasTreasure, isComplete: hasChar && hasTreasure };
      }).filter(item => item.hasChar || item.hasTreasure);
      const weaponCounts = { fire: 0, water: 0, thunder: 0, wind: 0 };
      weapons.forEach(w => { weaponCounts[w.element]++; });
      const rScore = chars.length >= 15 ? 21 : chars.length >= 12 ? 15 : chars.length >= 8 ? 7 : 0;
      const aScore = weapons.length >= 15 ? 20 : weapons.length >= 12 ? 14 : weapons.length >= 8 ? 6 : 0;
      const tScore = treasures.length >= 15 ? 22 : treasures.length >= 12 ? 16 : treasures.length >= 8 ? 8 : 0;
      const maxBigBonus = Math.max(rScore, aScore, tScore);

      return { bonds, hasQuad, hasXuShi, setsCount, setDetails, weaponCounts, counts: { char: chars.length, weapon: weapons.length, treasure: treasures.length }, scores: { r: rScore, a: aScore, t: tScore, max: maxBigBonus } };
    };

    const renderGameOverTier = (label, currentCount, tiers, scores, isHighestCount) => {
      let activeIdx = -1;
      for (let i = tiers.length - 1; i >= 0; i--) { if (currentCount >= tiers[i]) { activeIdx = i; break; } }
      const hlColor = '#d35400';
      const dimColor = '#bbb';
      const normalColor = '#666';
      return (
        <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <span style={{ color: isHighestCount ? hlColor : '#333', fontWeight: isHighestCount ? 'bold' : 'normal' }}>{label}: {currentCount}</span>
          <span style={{ fontSize: '11px', marginLeft: '8px', color: normalColor }}>
            ({tiers.map((t, i) => (<span key={`t-${i}`}><span style={{ color: i === activeIdx ? hlColor : dimColor, fontWeight: i === activeIdx ? 'bold' : 'normal' }}>{t}</span>{i < tiers.length - 1 && <span style={{ color: dimColor }}>/</span>}</span>))} <span style={{ color: dimColor }}> → </span> {scores.map((s, i) => (<span key={`s-${i}`}><span style={{ color: i === activeIdx ? hlColor : dimColor, fontWeight: i === activeIdx ? 'bold' : 'normal' }}>{s}</span>{i < scores.length - 1 && <span style={{ color: dimColor }}>/</span>}</span>))} <span style={{ color: dimColor }}>分</span>)
          </span>
        </div>
      );
    };

    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '40px', margin: '0 0 30px 0', color: '#333' }}>{isDraw ? '🤝 遊戲平手 (DRAW)' : '📊 遊戲結算 (Game Results)'}</h1>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['0', '1'].map(id => {
            const stats = getFinalStats(G.players[id].hand);
            const pScore = G.players[id].score;
            const isPWinner = id === winner;
            const maxCategoryCount = Math.max(stats.counts.char, stats.counts.weapon, stats.counts.treasure);
            const setTiers = [2, 4, 6]; const setScores = [4, 9, 15];
            let setTierIdx = -1;
            for (let i = setTiers.length - 1; i >= 0; i--) { if (stats.setsCount >= setTiers[i]) { setTierIdx = i; break; } }
            const weaponTiers = [3, 4, 5]; const weaponScores = [2, 5, 7];
            const weaponElements = [{ key: 'fire', label: '火', color: '#e67e22' }, { key: 'water', label: '水', color: '#2980b9' }, { key: 'thunder', label: '雷', color: '#f1c40f' }, { key: 'wind', label: '風', color: '#27ae60' }];
            const playerName = getPlayerName(id);

            return (
              <div key={id} style={{ padding: '20px', border: isPWinner ? '4px solid #f1c40f' : '1px solid #ccc', borderRadius: '16px', width: '340px', backgroundColor: id === playerID ? '#fcfdff' : '#fff', boxShadow: isPWinner ? '0 8px 20px rgba(241, 196, 15, 0.3)' : 'none', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                {isPWinner && <div style={{ position: 'absolute', top: '10px', right: '-30px', backgroundColor: '#f1c40f', color: '#fff', padding: '5px 40px', transform: 'rotate(45deg)', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>WINNER</div>}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <h2 style={{ margin: '0', fontSize: '24px', color: isPWinner ? '#d35400' : '#333' }}>
                    {isPWinner ? '👑 ' : ''}
                    {playerName} {id === playerID && "(You)"}
                  </h2>
                  <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#2c3e50', lineHeight: '1.2' }}>{pScore}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>FINAL SCORE</div>
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                  <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#2980b9', fontSize: '12px' }}>【人物組合】</div>
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{fontSize: '12px', fontWeight: 'bold', color: '#555'}}>👥 羈絆 ({stats.bonds.length * 2}分):</div>
                      <div style={{ paddingLeft: '10px' }}>{stats.bonds.length > 0 ? stats.bonds.map((bond, i) => (<div key={i} style={{ color: '#2c3e50', fontWeight: 'bold' }}>{bond}</div>)) : <span style={{ color: '#999' }}>無</span>}</div>
                    </div>
                    <div>🧩 四人組: {stats.hasQuad ? <span style={{color: '#27ae60', fontWeight:'bold'}}> 達成 (+6)</span> : <span style={{color: '#ccc'}}> 未達成</span>}</div>
                    <div>🏮 遊俠: {stats.hasXuShi ? <span style={{color: '#d35400', fontWeight:'bold'}}> 達成 (+1)</span> : <span style={{color: '#ccc'}}> 未達成</span>}</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#8e44ad', fontSize: '12px', marginBottom: '3px' }}>【套裝】</div>
                    <div>✨ 變身: {stats.setsCount} 套<span style={{ fontSize: '11px', marginLeft: '5px', color: '#666' }}> ({setTiers.map((t, i) => (<span key={i}><span style={{ color: i === setTierIdx ? '#d35400' : '#bbb', fontWeight: i === setTierIdx ? 'bold' : 'normal' }}>{t}</span>{i < setTiers.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}> → </span> {setScores.map((s, i) => (<span key={i}><span style={{ color: i === setTierIdx ? '#d35400' : '#bbb', fontWeight: i === setTierIdx ? 'bold' : 'normal' }}>{s}</span>{i < setScores.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}>分</span>)</span>
                      <div style={{ paddingLeft: '5px', marginTop: '2px' }}>{stats.setDetails.length > 0 ? (stats.setDetails.map((set, idx) => (<div key={idx} style={{ marginTop: '2px' }}>{set.isComplete ? <span style={{color: '#27ae60', fontWeight:'bold'}}>達成</span> : <span style={{color: '#bbb'}}>未達成</span>} {' ('}<span style={{ color: set.hasChar ? '#d35400' : '#bbb', fontWeight: set.hasChar ? 'bold' : 'normal' }}>{set.charName}</span>{' / '}<span style={{ color: set.hasTreasure ? '#d35400' : '#bbb', fontWeight: set.hasTreasure ? 'bold' : 'normal' }}>{set.treasureName}</span>{')'}</div>))) : (<div style={{color:'#999', fontSize:'11px'}}>無相關卡牌</div>)}</div>
                    </div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#c0392b', fontSize: '12px', marginBottom: '3px' }}>【武器】</div>
                    <div style={{ paddingLeft: '5px' }}>{weaponElements.map(el => {const count = stats.weaponCounts[el.key];let activeTier = -1;for (let i = weaponTiers.length - 1; i >= 0; i--) {if (count >= weaponTiers[i]) {activeTier = i;break;}}const isActive = activeTier > -1;return (<div key={el.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '2px' }}><span style={{ color: isActive ? el.color : '#bbb', fontWeight: isActive ? 'bold' : 'normal', minWidth: '35px' }}>{el.label}: {count}</span><span style={{ fontSize: '11px', marginLeft: '8px', color: '#666' }}>({weaponTiers.map((t, i) => (<span key={i}><span style={{ color: i === activeTier ? '#d35400' : '#bbb', fontWeight: i === activeTier ? 'bold' : 'normal' }}>{t}</span>{i < weaponTiers.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}> → </span> {weaponScores.map((s, i) => (<span key={i}><span style={{ color: i === activeTier ? '#d35400' : '#bbb', fontWeight: i === activeTier ? 'bold' : 'normal' }}>{s}</span>{i < weaponScores.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}>分</span>)</span></div>);})}</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px dashed #ccc', padding: '8px', borderRadius: '6px' }}>
                     <div style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '12px', marginBottom: '4px' }}>【三大獎勵 - 取最高】</div>
                     {renderGameOverTier("大團圓(人)", stats.counts.char, [8,12,15], [7,15,21], stats.counts.char === maxCategoryCount)}
                     {renderGameOverTier("大武庫(武)", stats.counts.weapon, [8,12,15], [6,14,20], stats.counts.weapon === maxCategoryCount)}
                     {renderGameOverTier("大富翁(寶)", stats.counts.treasure, [8,12,15], [8,16,22], stats.counts.treasure === maxCategoryCount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onLeave} style={{ marginTop: '40px', padding: '15px 50px', fontSize: '20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)' }}>回到大廳 (Back to Lobby)</button>
      </div>
    );
  }

  // --- 2. 正常遊戲畫面 ---
  const isMulligan = ctx.phase === 'mulligan';
  const isIntermission = ctx.phase === 'intermission';
  const myData = G.players[playerID];
  const isMyTurn = ctx.currentPlayer === playerID;

  let phaseTitle = '';
  if (isMulligan) phaseTitle = (<span>起始調度階段 <small style={{fontSize:'14px', fontWeight:'normal', color:'#666'}}>(選擇任意張數重抽)</small></span>);
  else if (isIntermission) phaseTitle = (<span>第 {G.round} 回合結束 <small style={{fontSize:'14px', fontWeight:'normal', color:'#666'}}>(請確認場況)</small></span>);
  else phaseTitle = (<span>第 {G.round} 回合 <small style={{fontSize:'14px', fontWeight:'normal', color:'#666'}}>(選牌階段)</small></span>);

  let maxSelectable = 1;
  let turnHint = "🔥 輪到你選牌 (請選 1 張)";
  
  if (isMyTurn && !isMulligan && !isIntermission) {
      let tempIndex = G.pickIndex + 1;
      while (tempIndex < G.pickOrder.length && G.pickOrder[tempIndex] === playerID) {
          maxSelectable++;
          tempIndex++;
      }
      if (maxSelectable > 1) turnHint = `🔥 輪到你選牌 (可連選 ${maxSelectable} 張)`;
      else if (G.pickIndex > 0 && G.pickOrder[G.pickIndex - 1] === playerID) turnHint = "🔥 輪到你選牌 (連選第 2 張 / 共 2 張)";
  }

  const handleCardClick = (origIdx) => {
    if (isMyTurn && !isMulligan && !isIntermission) {
        if (G.field[origIdx]?.taken) return;
        const isSelected = draftSelection.includes(origIdx);
        if (isSelected) setDraftSelection(draftSelection.filter(id => id !== origIdx));
        else if (draftSelection.length < maxSelectable) setDraftSelection([...draftSelection, origIdx]);
        else if (maxSelectable === 1) setDraftSelection([origIdx]);
    }
  };

  const handleConfirmPick = () => {
      if (draftSelection.length > 0) {
          moves.pickCard(draftSelection);
          setDraftSelection([]); 
      }
  };

  const getCardStyle = (type, element, isSelected = false, isTaken = false) => {
    let bgColor = '#fff';
    if (type === 'character') bgColor = '#e3f2fd';
    if (type === 'weapon') bgColor = '#fff9c4';
    if (type === 'treasure') bgColor = '#e8f5e9';
    if (isTaken) bgColor = '#f5f5f5';

    return {
      padding: '8px', margin: '4px', borderRadius: '8px', textAlign: 'center',
      border: isSelected ? '3px solid #e74c3c' : (isTaken ? '1px dashed #ccc' : '1px solid #999'),
      backgroundColor: bgColor, fontSize: '13px', fontWeight: 'bold',
      cursor: (isTaken || isIntermission ? 'not-allowed' : (isMulligan || (isMyTurn && !isMulligan)) ? 'pointer' : 'default'),
      boxShadow: isTaken ? 'none' : '2px 2px 5px rgba(0,0,0,0.05)',
      transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      minHeight: '40px', width: '110px', filter: isTaken ? 'grayscale(80%)' : 'none', opacity: isTaken ? 0.7 : 1,
      transform: isSelected ? 'scale(1.05)' : 'scale(1)'
    };
  };

  const myChars = myData.hand.filter(c => c.type === 'character');
  const myWeapons = myData.hand.filter(c => c.type === 'weapon');
  const myTreasures = myData.hand.filter(c => c.type === 'treasure');
  const charIds = new Set(myChars.map(c => c.id));
  const handIds = new Set(myData.hand.map(c => c.id)); 

  const renderProgress = () => {
    const chars = myChars;
    const weapons = myWeapons;
    const treasures = myTreasures;
    const bondsRender = [];
    const processedPairs = new Set();
    chars.forEach(c => {
      if (c.bondId) {
        const id1 = c.id < c.bondId ? c.id : c.bondId;
        const id2 = c.id < c.bondId ? c.bondId : c.id;
        const pairKey = `${id1}-${id2}`;
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          const card1 = cardDatabase.find(x => x.id === id1);
          const card2 = cardDatabase.find(x => x.id === id2);
          const hasC1 = charIds.has(id1);
          const hasC2 = charIds.has(id2);
          const isFull = hasC1 && hasC2;
          const name1 = card1.name.replace('人物-', '');
          const name2 = card2.name.replace('人物-', '');
          bondsRender.push(
            <div key={pairKey} style={{ marginTop: '3px' }}>
               {isFull ? <span style={{color: '#27ae60', fontWeight:'bold'}}>已達成</span> : <span style={{color: '#bbb'}}>未達成</span>} {' ('}<span style={{ color: hasC1 ? '#d35400' : '#bbb', fontWeight: hasC1 ? 'bold' : 'normal' }}>{name1}</span>{' / '}<span style={{ color: hasC2 ? '#d35400' : '#bbb', fontWeight: hasC2 ? 'bold' : 'normal' }}>{name2}</span>{')'}
            </div>
          );
        }
      }
    });
    const quadIds = [15, 16, 17, 18];
    const hasQuad = quadIds.every(id => charIds.has(id));
    const quadNames = quadIds.map(id => {const card = cardDatabase.find(c => c.id === id); return { name: card.name.replace('人物-', ''), hasIt: charIds.has(id) };});
    const hasXuShi = charIds.has(19);
    let setsCount = 0;
    treasures.forEach(t => { if (handIds.has(t.targetId)) setsCount++; });
    const weaponCounts = { fire: 0, water: 0, thunder: 0, wind: 0 };
    weapons.forEach(w => { weaponCounts[w.element]++; });
    const rScore = chars.length >= 15 ? 21 : chars.length >= 12 ? 15 : chars.length >= 8 ? 7 : 0;
    const aScore = weapons.length >= 15 ? 20 : weapons.length >= 12 ? 14 : weapons.length >= 8 ? 6 : 0;
    const tScore = treasures.length >= 15 ? 22 : treasures.length >= 12 ? 16 : treasures.length >= 8 ? 8 : 0;
    const maxBigBonus = Math.max(rScore, aScore, tScore);
    const maxCategoryCount = Math.max(chars.length, weapons.length, treasures.length);
    const renderTierLine = (label, currentCount, tiers, scores, isHighestCount) => {
      let activeIdx = -1;
      for (let i = tiers.length - 1; i >= 0; i--) { if (currentCount >= tiers[i]) { activeIdx = i; break; } }
      const hlColor = '#d35400';
      const dimColor = '#bbb';
      const normalColor = '#666';
      return (
        <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <span style={{ color: isHighestCount ? hlColor : '#333', fontWeight: isHighestCount ? 'bold' : 'normal' }}>{label}: {currentCount}</span>
          <span style={{ fontSize: '11px', marginLeft: '8px', color: normalColor }}>
            ({tiers.map((t, i) => (<span key={`t-${i}`}><span style={{ color: i === activeIdx ? hlColor : dimColor, fontWeight: i === activeIdx ? 'bold' : 'normal' }}>{t}</span>{i < tiers.length - 1 && <span style={{ color: dimColor }}>/</span>}</span>))} <span style={{ color: dimColor }}> → </span> {scores.map((s, i) => (<span key={`s-${i}`}><span style={{ color: i === activeIdx ? hlColor : dimColor, fontWeight: i === activeIdx ? 'bold' : 'normal' }}>{s}</span>{i < scores.length - 1 && <span style={{ color: dimColor }}>/</span>}</span>))} <span style={{ color: dimColor }}>分</span>)
          </span>
        </div>
      );
    };
    const setTiers = [2, 4, 6]; const setScores = [4, 9, 15];
    let setTierIdx = -1;
    for (let i = setTiers.length - 1; i >= 0; i--) { if (setsCount >= setTiers[i]) { setTierIdx = i; break; } }
    const setTreasures = cardDatabase.filter(c => c.type === 'treasure' && c.targetId);
    const setDetails = setTreasures.map(t => {const char = cardDatabase.find(c => c.id === t.targetId);const hasChar = handIds.has(char.id);const hasTreasure = handIds.has(t.id);return {charName: char.name.replace('人物-', ''),treasureName: t.name,hasChar,hasTreasure,isComplete: hasChar && hasTreasure};}).filter(item => item.hasChar || item.hasTreasure);
    const weaponTiers = [3, 4, 5]; const weaponScores = [2, 5, 7];
    const weaponElements = [{ key: 'fire', label: '火', color: '#e67e22' }, { key: 'water', label: '水', color: '#2980b9' }, { key: 'thunder', label: '雷', color: '#f1c40f' }, { key: 'wind', label: '風', color: '#27ae60' }];

    return (
      <div style={{ fontSize: '12px', color: '#333', background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6', lineHeight: '1.6' }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', marginBottom: '8px', fontSize: '14px' }}>📜 計分明細</div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#2980b9', fontSize: '11px', marginBottom: '3px' }}>【人物加成】</div>
          <div style={{ marginBottom: '5px' }}>
            <div style={{fontSize: '11px', fontWeight: 'bold', color: '#555'}}>👥 羈絆 ({bondsRender.length * 2}分):</div>
            <div className="info-two-col" style={{ paddingLeft: '5px' }}>{bondsRender.length > 0 ? bondsRender : <span style={{color:'#999'}}>無相關卡牌</span>}</div>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <div style={{fontSize: '11px', fontWeight: 'bold', color: '#555'}}>🧩 四人組 (+6):</div>
            <div style={{ paddingLeft: '5px' }}>{hasQuad ? <span style={{color: '#27ae60', fontWeight:'bold'}}>已達成</span> : <span style={{color: '#bbb'}}>未達成</span>} {' ('}{quadNames.map((q, i) => (<span key={i}><span style={{ color: q.hasIt ? '#d35400' : '#bbb', fontWeight: q.hasIt ? 'bold' : 'normal' }}>{q.name}</span>{i < 3 ? ' / ' : ''}</span>))}{')'}</div>
          </div>
          <div style={{ marginTop: '5px' }}>
            <div style={{fontSize: '11px', fontWeight: 'bold', color: '#555'}}>🏮 遊俠 (+1):</div>
            <div style={{ paddingLeft: '5px' }}>{hasXuShi ? <span style={{color: '#27ae60', fontWeight:'bold'}}>已達成</span> : <span style={{color: '#bbb'}}>未達成</span>} {' ('}<span style={{ color: hasXuShi ? '#d35400' : '#bbb', fontWeight: hasXuShi ? 'bold' : 'normal' }}>戌時</span>{')'}</div>
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#8e44ad', fontSize: '11px', marginBottom: '3px' }}>【套裝】</div>
          <div>✨ 變身: {setsCount} 套<span style={{ fontSize: '11px', marginLeft: '5px', color: '#666' }}> ({setTiers.map((t, i) => (<span key={i}><span style={{ color: i === setTierIdx ? '#d35400' : '#bbb', fontWeight: i === setTierIdx ? 'bold' : 'normal' }}>{t}</span>{i < setTiers.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}> → </span> {setScores.map((s, i) => (<span key={i}><span style={{ color: i === setTierIdx ? '#d35400' : '#bbb', fontWeight: i === setTierIdx ? 'bold' : 'normal' }}>{s}</span>{i < setScores.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}>分</span>)</span>
            <div className="info-two-col" style={{ paddingLeft: '5px', marginTop: '2px' }}>{setDetails.length > 0 ? (setDetails.map((set, idx) => (<div key={idx} style={{ marginTop: '2px' }}>{set.isComplete ? <span style={{color: '#27ae60', fontWeight:'bold'}}>達成</span> : <span style={{color: '#bbb'}}>未達成</span>} {' ('}<span style={{ color: set.hasChar ? '#d35400' : '#bbb', fontWeight: set.hasChar ? 'bold' : 'normal' }}>{set.charName}</span>{' / '}<span style={{ color: set.hasTreasure ? '#d35400' : '#bbb', fontWeight: set.hasTreasure ? 'bold' : 'normal' }}>{set.treasureName}</span>{')'}</div>))) : (<div style={{color:'#999', fontSize:'11px'}}>無相關卡牌</div>)}</div>
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#c0392b', fontSize: '11px', marginBottom: '3px' }}>【武器】</div>
          <div style={{ paddingLeft: '5px' }}>{weaponElements.map(el => {const count = weaponCounts[el.key];let activeTier = -1;for (let i = weaponTiers.length - 1; i >= 0; i--) {if (count >= weaponTiers[i]) {activeTier = i;break;}}const isActive = activeTier > -1;return (<div key={el.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '2px' }}><span style={{ color: isActive ? el.color : '#bbb', fontWeight: isActive ? 'bold' : 'normal', minWidth: '35px' }}>{el.label}: {count}</span><span style={{ fontSize: '11px', marginLeft: '8px', color: '#666' }}>({weaponTiers.map((t, i) => (<span key={i}><span style={{ color: i === activeTier ? '#d35400' : '#bbb', fontWeight: i === activeTier ? 'bold' : 'normal' }}>{t}</span>{i < weaponTiers.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}> → </span> {weaponScores.map((s, i) => (<span key={i}><span style={{ color: i === activeTier ? '#d35400' : '#bbb', fontWeight: i === activeTier ? 'bold' : 'normal' }}>{s}</span>{i < weaponScores.length - 1 && <span style={{ color: '#bbb' }}>/</span>}</span>))} <span style={{ color: '#bbb' }}>分</span>)</span></div>);})}</div>
        </div>
        <div style={{ padding: '8px', background: '#fff', border: '1px dotted #ccc', borderRadius: '4px' }}>
          <div style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '11px', marginBottom: '5px' }}>【三大獎勵 - 取最高】</div>
          {renderTierLine("大團圓(人)", chars.length, [8,12,15], [7,15,21], chars.length === maxCategoryCount)}
          {renderTierLine("大武庫(武)", weapons.length, [8,12,15], [6,14,20], weapons.length === maxCategoryCount)}
          {renderTierLine("大富翁(寶)", treasures.length, [8,12,15], [8,16,22], treasures.length === maxCategoryCount)}
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>{css}</style>
      <div className="room-info">
        Room: {matchID} | P{playerID}
      </div>
      <div className="game-container">
        <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{phaseTitle}</h2>
        </header>

        <div className="game-layout">
          <div className="left-panel">
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>中央選牌區</h4>
              <div style={{ background: '#f1f1f1', padding: '15px', borderRadius: '12px', minHeight: '110px' }}>
                {['character', 'weapon', 'treasure'].map(type => {
                   const fieldWithIdx = G.field.map((c, i) => ({...c, origIdx: i}));
                   const cards = fieldWithIdx.filter(c => c.type === type);
                   if (cards.length === 0) return null;
                   let borderColor = '#999';
                   if(type === 'character') borderColor = '#2196f3';
                   if(type === 'weapon') borderColor = '#fbc02d';
                   if(type === 'treasure') borderColor = '#4caf50';
                   return (
                     <div key={type} className="card-container" style={{ marginBottom: '8px', borderLeft: `3px solid ${borderColor}`, paddingLeft: '10px' }}>
                       {cards.map((card) => (
                          <div key={card.origIdx} className="card-item"
                               style={getCardStyle(card.type, card.element, draftSelection.includes(card.origIdx) && !isMulligan, card.taken)}
                               onClick={() => handleCardClick(card.origIdx)}>
                            <div>{card.name}</div>
                            {card.taken && <div className="taken-badge">P{card.takenBy}</div>}
                          </div>
                       ))}
                     </div>
                   )
                })}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>你的手牌</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {['character', 'weapon', 'treasure'].map(type => {
                  const cards = myData.hand.filter(c => c.type === type);
                  let borderColor = '#999';
                  if(type === 'character') borderColor = '#2196f3';
                  if(type === 'weapon') borderColor = '#fbc02d';
                  if(type === 'treasure') borderColor = '#4caf50';
                  return (
                    <div key={type} className="card-container" style={{ minHeight: '60px', borderLeft: `3px solid ${borderColor}`, paddingLeft: '10px' }}>
                      {cards.map((card, idx) => (
                        <div key={idx} className="card-item"
                          style={getCardStyle(card.type, card.element, myData.mulliganPicks.includes(myData.hand.indexOf(card)))} 
                          onClick={() => isMulligan && moves.toggleMulliganCard(myData.hand.indexOf(card))}
                        >
                          {card.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div style={{ padding: '15px', background: '#fff', border: '2px solid #333', borderRadius: '10px', textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ fontSize: '14px' }}>目前總分</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{myData.score}</div>
            </div>
            
            {renderProgress()}

            {isMulligan && !myData.ready && (
              <button onClick={() => moves.confirmMulligan()} className="confirm-btn">確認調度</button>
            )}
            {isMulligan && myData.ready && (
                <div className="wait-message">⏳ 等待對手 (P{1-playerID}) 完成調度...</div>
            )}

            {isMyTurn && !isMulligan && !isIntermission && (
              <>
                <div style={{ padding: '15px', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', textAlign: 'center', animation: 'pulse 2s infinite', marginTop: '15px' }}>
                  <strong style={{ color: '#f57f17' }}>{turnHint}</strong>
                </div>
                <button 
                    className="confirm-btn"
                    disabled={draftSelection.length === 0}
                    onClick={handleConfirmPick}
                >
                    確認選擇 (Confirm Pick)
                </button>
              </>
            )}

            {!isMulligan && !isMyTurn && !isIntermission && (
                <div className="wait-message">
                    👀 對手 (P{ctx.currentPlayer}) 正在思考選牌...
                </div>
            )}

            {isIntermission && (
              <div className="round-end-msg">
                {myData.ready ? 
                  "✅ 你已準備好，等待對手確認..." : 
                  <button className="confirm-btn" onClick={() => moves.readyForNextRound()}>準備進入下一回合</button>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. 簡易大廳組件 (Lobby Component)
// ==========================================
const NinjaLobby = ({ onJoin }) => {
  const generateRandomRoom = () => 'room-' + Math.floor(Math.random() * 10000);
  const [matchID, setMatchID] = useState(generateRandomRoom());
  const [playerID, setPlayerID] = useState(null);
  const [roomStatus, setRoomStatus] = useState({ 0: false, 1: false });

  // 自動檢查房間狀態 (Debounce)
  useEffect(() => {
    const checkRoom = async () => {
        if (!matchID) return;
        try {
            const resp = await fetch(`http://localhost:8000/games/ninja-draft/${matchID}`);
            if (resp.ok) {
                const data = await resp.json();
                const p0Occupied = data.players && data.players[0] && data.players[0].isConnected;
                const p1Occupied = data.players && data.players[1] && data.players[1].isConnected;
                setRoomStatus({ 0: p0Occupied, 1: p1Occupied });
            } else {
                setRoomStatus({ 0: false, 1: false });
            }
        } catch (e) {
            setRoomStatus({ 0: false, 1: false });
        }
    };
    
    // 每次 matchID 變更後立即檢查，並每 1.5 秒輪詢
    checkRoom();
    const interval = setInterval(checkRoom, 1500);
    return () => clearInterval(interval);
  }, [matchID]);

  const handleJoinClick = () => {
      if (playerID === null) { alert("請選擇位置 (P0 或 P1)！"); return; }
      onJoin(matchID, playerID);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#2c3e50', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '40px' }}>🥷 Ninja Draft Online</h1>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', color: '#333', width: '300px' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>房間 ID</label>
          <div style={{display:'flex', gap:'5px'}}>
            <input type="text" value={matchID} onChange={(e) => setMatchID(e.target.value)} style={{ flex:1, padding: '10px', fontSize: '16px' }} />
            <button onClick={() => setMatchID(generateRandomRoom())} style={{cursor:'pointer'}}>🎲</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>選擇位置</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => !roomStatus[0] && setPlayerID('0')}
              disabled={!!roomStatus[0]}
              style={{ 
                  flex: 1, padding: '10px', border: 'none', cursor: roomStatus[0] ? 'not-allowed' : 'pointer',
                  background: roomStatus[0] ? '#ccc' : (playerID === '0' ? '#2196f3' : '#e3f2fd'), 
                  color: roomStatus[0] ? '#666' : (playerID === '0' ? 'white' : '#333'),
                  opacity: roomStatus[0] ? 0.7 : 1
              }}
            >
              {roomStatus[0] ? '🚫 線上' : '👤 P0'}
            </button>
            <button 
              onClick={() => !roomStatus[1] && setPlayerID('1')}
              disabled={!!roomStatus[1]}
              style={{ 
                  flex: 1, padding: '10px', border: 'none', cursor: roomStatus[1] ? 'not-allowed' : 'pointer',
                  background: roomStatus[1] ? '#ccc' : (playerID === '1' ? '#f44336' : '#ffebee'), 
                  color: roomStatus[1] ? '#666' : (playerID === '1' ? 'white' : '#333'),
                  opacity: roomStatus[1] ? 0.7 : 1
              }}
            >
              {roomStatus[1] ? '🚫 線上' : '👤 P1'}
            </button>
          </div>
        </div>

        <button onClick={handleJoinClick} style={{ width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>進入遊戲</button>
      </div>
      <div style={{ marginTop: '20px', color: '#ccc', fontSize: '12px' }}></div>
    </div>
  );
};

// ==========================================
// 3. 主程式 (App)
// ==========================================
const App = () => {
  const [gameState, setGameState] = useState(null);

  // ★★★ 自動判斷連線環境 (Render 部署用) ★★★
  const SERVER_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://ninja-draft-server.onrender.com'; // <--- 之後這裡填入你的 Render 網址

  const handleJoin = (matchID, playerID) => {
    // 產生唯一憑證 (避免重整後斷線)
    const credKey = `ninja_cred_${matchID}_${playerID}`;
    let credentials = localStorage.getItem(credKey);
    if (!credentials) {
        credentials = Math.random().toString(36).substring(2);
        localStorage.setItem(credKey, credentials);
    }

    const NinjaClient = Client({
      game: NinjaDraft,
      board: NinjaBoard,
      // 使用變數決定連線位址
      multiplayer: SocketIO({ server: SERVER_URL }),
      credentials: credentials,
      debug: false,
    });

    setGameState({ matchID, playerID, NinjaClient });
  };

  const handleLeave = () => { setGameState(null); };

  if (!gameState) return <NinjaLobby onJoin={handleJoin} />;

  const { NinjaClient, matchID, playerID } = gameState;
  
  return (
    <div>
      <NinjaClient matchID={matchID} playerID={playerID} onLeave={handleLeave} />
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 100 }}>
        <button onClick={handleLeave} style={{ padding: '5px 10px', opacity: 0.5 }}>離開房間</button>
      </div>
    </div>
  );
};

export default App;