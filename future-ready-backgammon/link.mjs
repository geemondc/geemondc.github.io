// By Link mode: compact game-state codec for "send-a-move" links.
// Pure functions only (no DOM) so the round-trip can be unit-tested in node.
// The whole state rides in the URL hash fragment (#g=...), so nothing is
// ever sent to a server. Payload: a '|'-delimited compact string, UTF-8
// encoded, then base64url. Phone numbers and names travel ONLY inside
// this link (and the device's own local storage) — nowhere else.
const A31 = '0123456789abcdefghijklmnopqrstu'; // index = point value + 15  (-15..15)
const A36 = '0123456789abcdefghijklmnopqrstuvwxyz';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function b64encode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    if (i + 1 < bytes.length) out += B64[((b & 15) << 2) | (c >> 6)];
    if (i + 2 < bytes.length) out += B64[c & 63];
  }
  return out;
}
function b64decode(str) {
  if (typeof str !== 'string' || !str || str.length > 700 || /[^A-Za-z0-9\-_]/.test(str)) return null;
  const rev = {}; for (let i = 0; i < 64; i++) rev[B64[i]] = i;
  const bytes = [];
  for (let i = 0; i < str.length; i += 4) {
    const a = rev[str[i]], b = rev[str[i + 1]], c = rev[str[i + 2]], d = rev[str[i + 3]];
    if (a === undefined || b === undefined) return null;
    bytes.push((a << 2) | (b >> 4));
    if (c !== undefined) bytes.push(((b & 15) << 4) | (c >> 2));
    if (d !== undefined) bytes.push(((c & 3) << 6) | d);
    if (c === undefined && str[i + 2] !== undefined) return null;
  }
  return new Uint8Array(bytes);
}
const small = n => A36[n]; // 0..35 as one char
function unsmall(ch) { const i = A36.indexOf(ch); return i < 0 ? null : i; }
const clampInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

// state: {points[25] (idx 0 unused), bar[2], off[2], turn:0|1,
//         phase:'preroll'|'moving', dice:[], pair:[d,d],
//         cube:{enabled,value,owner:null|0|1}, target:int,
//         score:[a,b], dbl:null|0|1, names:[a,b], phone:string}
export function encodeLink(state) {
  let pts = '';
  for (let i = 1; i <= 24; i++) {
    const v = state.points[i] | 0;
    if (v < -15 || v > 15) throw new Error('point out of range');
    pts += A31[v + 15];
  }
  const cubeN = state.cube.enabled ? Math.round(Math.log2(state.cube.value)) : 0;
  const parts = [
    '1', pts,
    small(state.bar[0]) + small(state.bar[1]),
    small(state.off[0]) + small(state.off[1]),
    String(state.turn),
    state.phase === 'moving' ? 'm' : 'p',
    (state.dice || []).join(''),
    (state.pair || []).join(''),
    state.cube.enabled ? '1' : '0', String(cubeN),
    state.cube.owner === null || state.cube.owner === undefined ? 'n' : String(state.cube.owner),
    String(state.target),
    String(state.score[0]), String(state.score[1]),
    state.dbl === null || state.dbl === undefined ? '' : String(state.dbl),
    encodeURIComponent(state.names?.[0] || '') + '\u0001' + encodeURIComponent(state.names?.[1] || ''),
    encodeURIComponent(state.phone || ''),
  ];
  return b64encode(new TextEncoder().encode(parts.join('|')));
}

export function decodeLink(payload) {
  try {
    const bytes = b64decode(payload);
    if (!bytes) return null;
    const raw = new TextDecoder().decode(bytes);
    const p = raw.split('|');
    if (p.length !== 17 || p[0] !== '1') return null;
    if (p[1].length !== 24) return null;
    const points = [0];
    for (let i = 0; i < 24; i++) {
      const v = A31.indexOf(p[1][i]);
      if (v < 0) return null;
      points.push(v - 15);
    }
    const bar = [unsmall(p[2][0]), unsmall(p[2][1])];
    const off = [unsmall(p[3][0]), unsmall(p[3][1])];
    if (bar.includes(null) || off.includes(null) || p[2].length !== 2 || p[3].length !== 2) return null;
    const turn = p[4] === '0' ? 0 : p[4] === '1' ? 1 : null;
    if (turn === null) return null;
    const phase = p[5] === 'm' ? 'moving' : p[5] === 'p' ? 'preroll' : null;
    if (!phase) return null;
    const dice = p[6] === '' ? [] : p[6].split('').map(Number);
    if (dice.length > 4 || dice.some(d => !clampInt(d, 1, 6))) return null;
    if (phase === 'moving' && !dice.length) return null;
    const pair = p[7].length === 2 ? p[7].split('').map(Number) : [1, 1];
    if (pair.some(d => !clampInt(d, 1, 6))) return null;
    if (!/^[01]$/.test(p[8]) || !/^[0-6]$/.test(p[9])) return null;
    const cube = {
      enabled: p[8] === '1',
      value: 2 ** Number(p[9]),
      owner: p[10] === 'n' ? null : p[10] === '0' ? 0 : p[10] === '1' ? 1 : undefined,
    };
    if (cube.owner === undefined) return null;
    if (!cube.enabled && (cube.value !== 1 || cube.owner !== null)) { cube.value = 1; cube.owner = null; }
    const target = Number(p[11]);
    if (![1, 3, 5, 7].includes(target)) return null;
    const score = [Number(p[12]), Number(p[13])];
    if (score.some(v => !clampInt(v, 0, 999))) return null;
    const dbl = p[14] === '' ? null : p[14] === '0' ? 0 : p[14] === '1' ? 1 : undefined;
    if (dbl === undefined) return null;
    if (dbl !== null && dbl === turn) return null; // offerer is never the player to move
    const nameParts = p[15].split('\u0001');
    if (nameParts.length !== 2) return null;
    const names = nameParts.map(x => decodeURIComponent(x).slice(0, 24));
    const phone = decodeURIComponent(p[16]).replace(/[^\d+]/g, '').slice(0, 20);
    // Checker conservation: each side must total exactly 15.
    for (let pl = 0; pl < 2; pl++) {
      let n = bar[pl] + off[pl];
      for (let i = 1; i <= 24; i++) if ((pl === 0 && points[i] > 0) || (pl === 1 && points[i] < 0)) n += Math.abs(points[i]);
      if (n !== 15) return null;
    }
    if (off[0] === 15 || off[1] === 15) return null; // finished games are not sent
    return { points, bar, off, turn, phase, dice, pair, cube, target, score, dbl, names, phone };
  } catch { return null; }
}

export function linkFromState(baseUrl, state) {
  return baseUrl.split('#')[0] + '#g=' + encodeLink(state);
}
export function stateFromHash(hash) {
  if (!hash || !hash.startsWith('#g=')) return null;
  return decodeLink(hash.slice(3));
}
