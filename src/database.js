// src/database.js

export const TYPES = {
  CHARACTER: 'character',
  WEAPON: 'weapon',
  TREASURE: 'treasure',
};

export const ELEMENTS = {
  NONE: 'none',
  FIRE: 'fire',
  WATER: 'water',
  THUNDER: 'thunder',
  WIND: 'wind',
};

export const cardDatabase = [
  // --- 1. 人物 (Characters) - 共 19 張 ---
  // A. 兩兩成對 (Bond: +2)
  { id: 1, name: '人物-小黑', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, bondId: 2 },
  { id: 2, name: '人物-龍焰', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, bondId: 1 },
  { id: 3, name: '人物-琳', type: TYPES.CHARACTER, element: ELEMENTS.WATER, bondId: 4 },
  { id: 4, name: '人物-雪舞', type: TYPES.CHARACTER, element: ELEMENTS.WATER, bondId: 3 },
  { id: 5, name: '人物-蒼牙', type: TYPES.CHARACTER, element: ELEMENTS.WIND, bondId: 6 },
  { id: 6, name: '人物-緋斬', type: TYPES.CHARACTER, element: ELEMENTS.WIND, bondId: 5 },
  { id: 7, name: '人物-阿力', type: TYPES.CHARACTER, element: ELEMENTS.THUNDER, bondId: 8 },
  { id: 8, name: '人物-超威', type: TYPES.CHARACTER, element: ELEMENTS.THUNDER, bondId: 7 },
  { id: 9, name: '人物-小椒', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, bondId: 10 },
  { id: 10, name: '人物-星閃', type: TYPES.CHARACTER, element: ELEMENTS.THUNDER, bondId: 9 },
  { id: 11, name: '人物-伊賀', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, bondId: 12 },
  { id: 12, name: '人物-兮蘭', type: TYPES.CHARACTER, element: ELEMENTS.WATER, bondId: 11 },
  { id: 13, name: '人物-銀梟', type: TYPES.CHARACTER, element: ELEMENTS.WIND, bondId: 14 },
  { id: 14, name: '人物-小夜', type: TYPES.CHARACTER, element: ELEMENTS.WATER, bondId: 13 },

  // B. 四人組合 (落青/衛鯉/紫原/隼白) - 全部集齊 +6 分
  { id: 15, name: '人物-落青', type: TYPES.CHARACTER, element: ELEMENTS.WIND, groupId: 'quad' },
  { id: 16, name: '人物-衛鯉', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, groupId: 'quad' },
  { id: 17, name: '人物-紫原', type: TYPES.CHARACTER, element: ELEMENTS.THUNDER, groupId: 'quad' },
  { id: 18, name: '人物-隼白', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, groupId: 'quad' },

  // C. 單人計分 (戌時) - 拿到即 +1 分
  { id: 19, name: '人物-戌時', type: TYPES.CHARACTER, element: ELEMENTS.FIRE, bondId: null },

  // --- 2. 武器 (Weapons) - 4屬性 x 5張 = 20 張 ---
  // 火
  { id: 101, name: '武器-火1', type: TYPES.WEAPON, element: ELEMENTS.FIRE },
  { id: 102, name: '武器-火2', type: TYPES.WEAPON, element: ELEMENTS.FIRE },
  { id: 103, name: '武器-火3', type: TYPES.WEAPON, element: ELEMENTS.FIRE },
  { id: 104, name: '武器-火4', type: TYPES.WEAPON, element: ELEMENTS.FIRE },
  { id: 105, name: '武器-火5', type: TYPES.WEAPON, element: ELEMENTS.FIRE },
  // 水
  { id: 106, name: '武器-水1', type: TYPES.WEAPON, element: ELEMENTS.WATER },
  { id: 107, name: '武器-水2', type: TYPES.WEAPON, element: ELEMENTS.WATER },
  { id: 108, name: '武器-水3', type: TYPES.WEAPON, element: ELEMENTS.WATER },
  { id: 109, name: '武器-水4', type: TYPES.WEAPON, element: ELEMENTS.WATER },
  { id: 110, name: '武器-水5', type: TYPES.WEAPON, element: ELEMENTS.WATER },
  // 雷
  { id: 111, name: '武器-雷1', type: TYPES.WEAPON, element: ELEMENTS.THUNDER },
  { id: 112, name: '武器-雷2', type: TYPES.WEAPON, element: ELEMENTS.THUNDER },
  { id: 113, name: '武器-雷3', type: TYPES.WEAPON, element: ELEMENTS.THUNDER },
  { id: 114, name: '武器-雷4', type: TYPES.WEAPON, element: ELEMENTS.THUNDER },
  { id: 115, name: '武器-雷5', type: TYPES.WEAPON, element: ELEMENTS.THUNDER },
  // 風
  { id: 116, name: '武器-風1', type: TYPES.WEAPON, element: ELEMENTS.WIND },
  { id: 117, name: '武器-風2', type: TYPES.WEAPON, element: ELEMENTS.WIND },
  { id: 118, name: '武器-風3', type: TYPES.WEAPON, element: ELEMENTS.WIND },
  { id: 119, name: '武器-風4', type: TYPES.WEAPON, element: ELEMENTS.WIND },
  { id: 120, name: '武器-風5', type: TYPES.WEAPON, element: ELEMENTS.WIND },

  // --- 3. 專寶 (Treasures) - 對應 19 位人物 ---
  { id: 201, name: '專寶-小黑', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 1 },
  { id: 202, name: '專寶-龍焰', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 2 },
  { id: 203, name: '專寶-琳', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 3 },
  { id: 204, name: '專寶-雪舞', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 4 },
  { id: 205, name: '專寶-蒼牙', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 5 },
  { id: 206, name: '專寶-緋斬', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 6 },
  { id: 207, name: '專寶-阿力', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 7 },
  { id: 208, name: '專寶-超威', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 8 },
  { id: 209, name: '專寶-小椒', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 9 },
  { id: 210, name: '專寶-星閃', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 10 },
  { id: 211, name: '專寶-伊賀', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 11 },
  { id: 212, name: '專寶-兮蘭', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 12 },
  { id: 213, name: '專寶-銀梟', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 13 },
  { id: 214, name: '專寶-小夜', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 14 },
  { id: 215, name: '專寶-落青', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 15 },
  { id: 216, name: '專寶-衛鯉', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 16 },
  { id: 217, name: '專寶-紫原', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 17 },
  { id: 218, name: '專寶-隼白', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 18 },
  { id: 219, name: '專寶-戌時', type: TYPES.TREASURE, element: ELEMENTS.NONE, targetId: 19 },
];

export const generateDeck = () => {
  return [...cardDatabase];
};