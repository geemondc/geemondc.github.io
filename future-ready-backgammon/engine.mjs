// Pure rules engine. Physical points 1..24; white descends, black ascends.
export const clone = s => ({points:[...s.points],bar:[...s.bar],off:[...s.off]});
export const sign = p => p===0 ? 1 : -1;
export const relative = (i,p) => p===0 ? i : 25-i;
export const physical = relative;
export function initial() {
  const s={points:Array(25).fill(0),bar:[0,0],off:[0,0]};
  for(const [i,n] of [[24,2],[13,5],[8,3],[6,5]]) {s.points[i]=n;s.points[25-i]=-n;}
  return s;
}
export function pip(s,p){let n=s.bar[p]*25;for(let i=1;i<=24;i++)if(s.points[i]*sign(p)>0)n+=Math.abs(s.points[i])*relative(i,p);return n;}
export function allHome(s,p){if(s.bar[p])return false;for(let i=1;i<=24;i++)if(s.points[i]*sign(p)>0&&relative(i,p)>6)return false;return true;}
export function rawMoves(s,p,d) {
  const sg=sign(p),out=[],home=allHome(s,p);
  if(s.bar[p]) {const to=physical(25-d,p);return s.points[to]*sg>=-1?[{from:0,to,die:d}]:[];}
  for(let i=1;i<=24;i++) {
    if(s.points[i]*sg<=0)continue;
    const r=relative(i,p),dest=r-d;
    if(dest>0){const to=physical(dest,p);if(s.points[to]*sg>=-1)out.push({from:i,to,die:d});}
    else if(home) {
      let higher=false;
      for(let j=1;j<=24;j++)if(s.points[j]*sg>0&&relative(j,p)>r)higher=true;
      if(dest===0||!higher)out.push({from:i,to:25,die:d});
    }
  }
  return out;
}
export function apply(s,p,m) {
  const t=clone(s),sg=sign(p);
  if(m.from===0)t.bar[p]--;else t.points[m.from]-=sg;
  if(m.to===25)t.off[p]++;
  else {
    if(t.points[m.to]===-sg){t.points[m.to]=0;t.bar[1-p]++;}
    t.points[m.to]+=sg;
  }
  return t;
}
export const removeDie = (dice,d) => {const a=[...dice];a.splice(a.indexOf(d),1);return a;};
const key=(s,d)=>s.points.join(',')+'|'+s.bar+'|'+s.off+'|'+[...d].sort();
function maxUse(s,p,dice,memo) {
  if(!dice.length||s.off[p]===15)return 0;
  const k=key(s,dice);if(memo.has(k))return memo.get(k);
  let max=0;
  for(const d of new Set(dice))for(const m of rawMoves(s,p,d)) {
    max=Math.max(max,1+maxUse(apply(s,p,m),p,removeDie(dice,d),memo));
    if(max===dice.length){memo.set(k,max);return max;}
  }
  memo.set(k,max);return max;
}
export function legalMoves(s,p,dice) {
  const memo=new Map(),max=maxUse(s,p,dice,memo);if(!max)return [];
  let out=[];
  for(const d of new Set(dice))for(const m of rawMoves(s,p,d))
    if(1+maxUse(apply(s,p,m),p,removeDie(dice,d),memo)===max)out.push(m);
  if(max===1&&new Set(dice).size>1){const high=Math.max(...out.map(m=>m.die));out=out.filter(m=>m.die===high);}
  return out;
}
export function rollDice(a,b){return a===b?[a,a,a,a]:[a,b];}
export function opening(a,b){return a===b?null:{player:a>b?0:1,dice:[a,b]};}
export function winType(s,winner) {
  const loser=1-winner;
  if(s.off[loser])return 1;
  if(s.bar[loser])return 3;
  for(let i=1;i<=24;i++)if(s.points[i]*sign(loser)>0&&relative(i,winner)<=6)return 3;
  return 2;
}
export const pointsWon=(cubeEnabled,cube,type,declined=false)=>cubeEnabled?cube*(declined?1:type):1;
export function canDouble(cube,p,phase){return cube.enabled&&phase==='preroll'&&cube.value<64&&(cube.owner===null||cube.owner===p);}
export function acceptDouble(cube,p){return {...cube,value:cube.value*2,owner:1-p};}
export function evaluate(s,p) {
  const sg=sign(p);let score=(pip(s,1-p)-pip(s,p))*1.25+s.off[p]*12-s.off[1-p]*12+s.bar[1-p]*12-s.bar[p]*15;
  if(s.off[p]===15)return 100000;
  for(let i=1;i<=24;i++)if(s.points[i]*sg>0) {
    const n=Math.abs(s.points[i]),r=relative(i,p);
    if(n>=2)score+=(r<=6?7:4)+(n===2?2:0);
    if(n>5)score-=(n-5)*2;
    if(n===1) {
      let danger=s.bar[1-p]&&r>=19?1:0;
      for(let j=1;j<=24;j++)if(s.points[j]*sg<0){const distance=relative(i,1-p)-relative(j,1-p);if(distance<0&&distance>=-12)danger+=distance>=-6?1:.35;}
      score-=danger*5;
    }
  }
  return score;
}
export function bestTurn(s,p,dice) {
  const memo=new Map();
  function walk(state,ds) {
    const k=key(state,ds);if(memo.has(k))return memo.get(k);
    const moves=legalMoves(state,p,ds);
    if(!moves.length)return {score:evaluate(state,p),moves:[]};
    let best={score:-Infinity,moves:[]};
    for(const m of moves){const next=walk(apply(state,p,m),removeDie(ds,m.die));if(next.score>best.score)best={score:next.score,moves:[m,...next.moves]};}
    memo.set(k,best);return best;
  }
  return walk(s,dice).moves;
}
export function cubeEquity(s,p){return (pip(s,1-p)-pip(s,p))/Math.max(35,pip(s,1-p))+s.off[p]*.025-s.off[1-p]*.025+(s.bar[1-p]-s.bar[p])*.045;}
export function invariant(s){for(let p=0;p<2;p++){let n=s.bar[p]+s.off[p];for(let i=1;i<=24;i++)if(s.points[i]*sign(p)>0)n+=Math.abs(s.points[i]);if(n!==15)throw Error('Checker conservation '+p+': '+n);}return true;}
