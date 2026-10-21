import * as E from './engine.mjs';
import {HERO} from './hero-data.mjs';
const $=s=>document.querySelector(s);
const previewMemory=new Map();
const storage={
 get(k,f){try{const v=window.localStorage.getItem('fr-backgammon:'+k);if(v!==null)return JSON.parse(v);}catch(e){}return previewMemory.has(k)?previewMemory.get(k):f;},
 set(k,v){previewMemory.set(k,v);try{window.localStorage.setItem('fr-backgammon:'+k,JSON.stringify(v));}catch(e){}}
};
const storedSetup=storage.get('setup',{});
const pref=storedSetup&&typeof storedSetup==='object'?storedSetup:{};
let lang=storage.get('language','en')==='es'?'es':'en',sound=storage.get('sound',true)!==false;
let cfg={players:pref.players===2?2:1,cube:pref.cube===true,target:[1,3,5,7].includes(pref.target)?pref.target:3,coach:pref.coach!==false};
if(cfg.cube&&cfg.target===1)cfg.target=3;
const dictionary={
 en:{brand:'FUTURE READY',club:'A LITTLE STRATEGY. A LOT OF FUN.',title:'BACKGAMMON',lead:"The world's oldest race-and-hit board game. Roll, race, hit, and bear off first.",sound:'Sound',on:'On',off:'Off',qr:'QR',setup:'Make it your game',tag:'ALL AGES',players:'WHO’S PLAYING?',one:'1 PLAYER',two:'2 PLAYERS',computerSub:'You against a clever computer opponent.',friendSub:'Pass the device. Challenge a friend.',matchSetup:'MATCH SETUP',without:'WITHOUT CUBE',with:'WITH CUBE',simple:'Every game = 1 win. A friendly race to the finish.',classic:'The cube raises the stakes. Gammons ×2, backgammons ×3.',targetGames:'FIRST TO HOW MANY GAME WINS?',targetPoints:'FIRST TO HOW MANY POINTS?',coach:'Coach hints',coachSub:'A little nudge when you need one.',start:'LET’S PLAY',noLogin:'No ads. No login. Just one more game.',how:'HOW TO PLAY',free:'Always free to play',friends:'Better together',ages:'Easy to learn. Fun to master.',footer:'A timeless game. A fresh way to play.',scores:'Lifetime scores',menu:'Menu',close:'Close',resume:'RESUME',intro:'BACK TO SETUP',reset:'RESET SCORES',resetQuestion:'Reset lifetime scores?',resetBody:'This clears saved lifetime tallies on this device. Your current match stays as it is.',cancel:'CANCEL',resetYes:'YES, RESET',you:'You',computer:'Computer',white:'White',black:'Black',pips:'Pips',match:'MATCH',first:'First to',games:'games',points:'points',wins:'Game wins',matches:'Matches won',gammons:'Gammons',backgammons:'Backgammons',totalPoints:'Total points',opening:'One die each. Higher roll starts!',tie:'A tie! Roll again.',rollStart:'ROLL TO START',roll:'ROLL DICE',confirm:'CONFIRM MOVE',pass:'CONFIRM PASS',undo:'UNDO',thinking:'Computer is thinking…',turn:'to play',move:'Tap a glowing checker, then its destination.',try:'Try this one!',confirmHelp:'Happy with your moves? Tap CONFIRM MOVE.',blocked:'No legal moves. Confirm to pass.',barHelp:'Enter every checker from the bar first.',offHelp:'All home! Move to the tray to bear off.',rollHelp:'Your turn. Roll the dice!',double:'DOUBLE',center:'Center',cube:'Cube',cubeOwner:'Owner',doubleTitle:'Raise the stakes?',doubleBody:'offers to double the cube to',accept:'ACCEPT',decline:'DECLINE',declineNote:'Accept and own the cube, or decline and lose this game at its current value.',accepted:'Double accepted.',declined:'Double declined',win:'wins!',gameWinner:'GAME WINNER',matchWinner:'MATCH WINNER',single:'A beautiful finish!',gammon:'GAMMON!',backgammon:'BACKGAMMON!',next:'NEXT GAME',again:'PLAY AGAIN',change:'CHANGE SETUP',earned:'earned',final:'Final tally',scan:'Scan to play on another phone',qrTitle:'Good games travel.',rotate:'A little room to roll.',rotateBody:'Turn your phone sideways for the full board.',rotateBtn:'PLAY SIDEWAYS',bar:'BAR',tray:'OFF',moveNo:'moves left',turnWhite:'White moves 24 → 1',turnBlack:'Black moves 1 → 24',confirming:'Placing checker…',matchEnded:'Match complete',newMatch:'A new match starts with your current setup.',rule1:'Start with 15 checkers each: 2 on your 24-point, 5 on 13, 3 on 8, and 5 on 6. Each player rolls one die; the higher roll starts using both numbers. Ties roll again.',rule2:'Move toward your home (points 1–6), one move per die, in either order. Doubles give four moves. Use both dice if possible; if only one can be used and either would work, use the higher.',rule3:'Two or more opposing checkers block a point. Land on a single opposing checker to send it to the bar. Re-enter every checker from the bar before moving anything else, into the opponent’s home on 25 minus the die.',rule4:'When every remaining checker is home, bear off with an exact die. A higher die can remove your highest checker only if none are farther from home. First to bear off all 15 wins.',rule5:'A gammon means the loser bore off none. It is a backgammon if they also have a checker on the bar or in the winner’s home. With the cube, these score ×2 or ×3; without it, every game is just 1 win.',rule6:'With the cube: before rolling, offer a double if the cube is centered or yours. Accepting gives the other player cube ownership; declining loses the current cube value. First to reach or pass the points target wins. Without the cube, first to the chosen number of game wins wins.',rule7:'Tap or drag a checker to a glowing destination. Undo as often as you like before confirming. Each player’s point numbers run in opposite directions; White moves counterclockwise around the board.'},
 es:{brand:'FUTURE READY',club:'UN POCO DE ESTRATEGIA. MUCHA DIVERSIÓN.',title:'BACKGAMMON',lead:'El clásico juego de carreras y capturas. Tira los dados, avanza, captura y saca tus fichas primero.',sound:'Sonido',on:'Sí',off:'No',qr:'QR',setup:'Juega a tu manera',tag:'PARA TODOS',players:'¿QUIÉN JUEGA?',one:'1 JUGADOR',two:'2 JUGADORES',computerSub:'Tú contra un rival inteligente.',friendSub:'Pasen el dispositivo y jueguen entre amigos.',matchSetup:'TIPO DE ENCUENTRO',without:'SIN CUBO',with:'CON CUBO',simple:'Cada partida = 1 victoria. ¡Así de sencillo!',classic:'El cubo multiplica los puntos. Gammon ×2, backgammon ×3.',targetGames:'¿CUÁNTAS VICTORIAS PARA GANAR?',targetPoints:'¿CUÁNTOS PUNTOS PARA GANAR?',coach:'Pistas del entrenador',coachSub:'Una ayudita cuando la necesites.',start:'¡A JUGAR!',noLogin:'Sin anuncios. Sin registro. Solo diversión.',how:'CÓMO JUGAR',free:'Siempre gratis',friends:'Mejor en compañía',ages:'Fácil de aprender. Un reto dominarlo.',footer:'Un juego de siempre. Una forma nueva de jugar.',scores:'Resultados acumulados',menu:'Menú',close:'Cerrar',resume:'CONTINUAR',intro:'VOLVER AL INICIO',reset:'BORRAR RESULTADOS',resetQuestion:'¿Borrar los resultados?',resetBody:'Se borrarán los resultados acumulados en este dispositivo. El encuentro actual no cambiará.',cancel:'CANCELAR',resetYes:'SÍ, BORRAR',you:'Tú',computer:'Computadora',white:'Blancas',black:'Negras',pips:'Avance',match:'ENCUENTRO',first:'Primero en llegar a',games:'victorias',points:'puntos',wins:'Victorias',matches:'Encuentros ganados',gammons:'Gammons',backgammons:'Backgammons',totalPoints:'Puntos totales',opening:'Un dado cada uno. ¡Empieza el mayor!',tie:'¡Empate! Vuelvan a tirar.',rollStart:'TIRAR PARA EMPEZAR',roll:'TIRAR DADOS',confirm:'CONFIRMAR JUGADA',pass:'CONFIRMAR PASE',undo:'DESHACER',thinking:'La computadora está pensando…',turn:'juega',move:'Toca una ficha iluminada y después su destino.',try:'¡Prueba esta!',confirmHelp:'¿Te gusta tu jugada? Toca CONFIRMAR JUGADA.',blocked:'No hay jugadas posibles. Confirma para pasar.',barHelp:'Primero debes sacar todas tus fichas de la barra.',offHelp:'¡Todas en casa! Llévalas a la bandeja para sacarlas.',rollHelp:'¡Tu turno! Tira los dados.',double:'DOBLAR',center:'Centro',cube:'Cubo',cubeOwner:'Dueño',doubleTitle:'¿Subimos la apuesta?',doubleBody:'ofrece doblar el cubo a',accept:'ACEPTAR',decline:'RECHAZAR',declineNote:'Acepta y recibe el cubo, o rechaza y pierde la partida por el valor actual.',accepted:'Doble aceptado.',declined:'Doble rechazado',win:'gana!',gameWinner:'GANADOR DE LA PARTIDA',matchWinner:'GANADOR DEL ENCUENTRO',single:'¡Una gran victoria!',gammon:'¡GAMMON!',backgammon:'¡BACKGAMMON!',next:'SIGUIENTE PARTIDA',again:'VOLVER A JUGAR',change:'CAMBIAR OPCIONES',earned:'sumados',final:'Resultado final',scan:'Escanea para jugar en otro teléfono',qrTitle:'Comparte la diversión.',rotate:'Un poco de espacio para jugar.',rotateBody:'Gira el teléfono para ver el tablero completo.',rotateBtn:'JUGAR EN HORIZONTAL',bar:'BARRA',tray:'FUERA',moveNo:'jugadas restantes',turnWhite:'Blancas: 24 → 1',turnBlack:'Negras: 1 → 24',confirming:'Moviendo ficha…',matchEnded:'Encuentro terminado',newMatch:'Empieza otro encuentro con las mismas opciones.',rule1:'Cada jugador empieza con 15 fichas: 2 en su punto 24, 5 en el 13, 3 en el 8 y 5 en el 6. Cada uno tira un dado; empieza quien saque el mayor y usa ambos números. Si empatan, repiten.',rule2:'Avanza hacia tu casa (puntos 1–6), una jugada por dado, en el orden que quieras. Los dobles permiten cuatro jugadas. Usa ambos dados si es posible; si solo puedes usar uno y cualquiera serviría, debes usar el mayor.',rule3:'Dos o más fichas rivales bloquean un punto. Al caer sobre una sola, la mandas a la barra. Antes de mover otras fichas, debes reintroducir todas las de la barra en la casa rival, en el punto 25 menos el dado.',rule4:'Cuando todas tus fichas restantes estén en casa, puedes sacarlas con el número exacto. Un dado mayor permite sacar la ficha más alejada, siempre que no quede ninguna detrás. Gana quien saque primero las 15.',rule5:'Es gammon si el rival no ha sacado ninguna ficha. Es backgammon si, además, tiene una en la barra o en tu casa. Con cubo, valen ×2 y ×3; sin cubo, cada partida cuenta como 1 victoria.',rule6:'Con cubo: antes de tirar, puedes doblar si el cubo está en el centro o es tuyo. Si el rival acepta, recibe el cubo; si rechaza, pierde por el valor actual. Gana quien alcance o supere la meta de puntos. Sin cubo, gana quien llegue a las victorias elegidas.',rule7:'Toca o arrastra una ficha hasta un destino iluminado. Puedes deshacer todo antes de confirmar. Los puntos se numeran en sentidos opuestos para cada jugador; las blancas avanzan en sentido antihorario.'}
};
const t=k=>dictionary[lang][k]??k;
const statsEmpty=()=>({games:0,gammons:0,backgammons:0,matches:0,points:0});
const savedStats=storage.get('scores',[]);
let lifetime=[0,1].map(i=>Object.fromEntries(Object.keys(statsEmpty()).map(k=>[k,Number.isSafeInteger(savedStats?.[i]?.[k])&&savedStats[i][k]>=0?Math.min(savedStats[i][k],1000000000):0])));
let s=null,match=null,phase='intro',player=0,dice=[],pair=[1,1],openingPair=true,selected=null,history=[],cube=null,modal=null,notice='',result=null,token=0,forced=false,rolling=false,busy=false,fast=1,hint=null,legal=[],boardGeom=null,seen=storage.get('guided',false),audioCtx=null;
let queuedRolls=[];
const names=p=>cfg.players===1?(p===0?t('you'):t('computer')):t(p===0?'white':'black');
const human=()=>cfg.players===2||player===0;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms*fast)));
function randomDie(){if(queuedRolls.length)return queuedRolls.shift();const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%6+1;}
function soundPlay(type='click'){
 if(!sound)return;try{
  audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();
  const ctx=audioCtx,now=ctx.currentTime;
  const tones=type==='win'?[523,659,784,1046,784,1046]:type==='off'?[660,880,1100]:type==='hit'?[125,85]:type==='roll'?[220,170,260,190,300,130]:type==='cube'?[200,140]:[420];
  tones.forEach((f,i)=>{const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type==='win'||type==='off'?'sine':'triangle';osc.frequency.setValueAtTime(f,now+i*.085);osc.frequency.exponentialRampToValueAtTime(f*.65,now+i*.085+.08);g.gain.setValueAtTime(.0001,now+i*.085);g.gain.exponentialRampToValueAtTime(.07,now+i*.085+.006);g.gain.exponentialRampToValueAtTime(.0001,now+i*.085+.16);osc.connect(g);g.connect(ctx.destination);osc.start(now+i*.085);osc.stop(now+i*.085+.18);});
 }catch{}
}
function persist(){storage.set('setup',cfg);storage.set('language',lang);storage.set('sound',sound);}
const soundButton=()=>`<button data-action="sound" class="quiet-btn" aria-pressed="${sound}">${t('sound')} ${t(sound?'on':'off')}</button>`;
const languageButton=()=>`<button data-action="language" class="quiet-btn" aria-label="${lang==='en'?'Cambiar a español':'Switch to English'}">${lang==='en'?'EN / ES':'ES / EN'}</button>`;
const rules=()=>`<div class="rules">${[1,2,3,4,5,6,7].map(i=>`<p>${t('rule'+i)}</p>`).join('')}</div>`;
function renderIntro(){
 document.body.style.overflow='auto';document.documentElement.lang=lang;
 $('#app').innerHTML=`<div class="intro">
 <nav class="intro-nav"><div class="wordmark"><span class="brand-dot"></span>FUTURE READY</div><div class="nav-actions">${soundButton()}<button class="quiet-btn" data-action="qr">QR</button>${languageButton()}</div></nav>
 <div class="intro-layout"><section class="intro-story"><div class="eyebrow">${t('club')}</div><h1>BACKGAMMON</h1><p class="lead">${t('lead')}</p>
 <div class="hero-frame"><img src="${HERO}" alt="${lang==='en'?'Eight colorful friends gathered around a wooden backgammon board':'Ocho amigos de colores reunidos alrededor de un tablero de backgammon'}"><div class="hero-badge"><span></span>${t('friends')}</div></div>
 <div class="under-art"><b>${t('free')}</b><span>${t('ages')}</span></div>
 <details class="how"><summary>${t('how')}</summary>${rules()}</details></section>
 <section class="setup"><div class="setup-heading"><h2>${t('setup')}</h2><span class="tag">${t('tag')}</span></div>
 <div class="field"><div class="field-title">${t('players')}</div><div class="choice-group">${[1,2].map(p=>`<button data-action="players" data-value="${p}" class="${cfg.players===p?'active':''}" aria-pressed="${cfg.players===p}">${t(p===1?'one':'two')}</button>`).join('')}</div><p class="field-explain">${t(cfg.players===1?'computerSub':'friendSub')}</p></div>
 <div class="field"><div class="field-title">${t('matchSetup')}</div><div class="choice-group">${[false,true].map(v=>`<button data-action="cube-mode" data-value="${v}" class="${cfg.cube===v?'active':''}" aria-pressed="${cfg.cube===v}">${t(v?'with':'without')}</button>`).join('')}</div><p class="field-explain">${t(cfg.cube?'classic':'simple')}</p></div>
 <div class="field"><div class="field-title">${t(cfg.cube?'targetPoints':'targetGames')}</div><div class="targets">${(cfg.cube?[3,5,7]:[1,3,5,7]).map(n=>`<button data-action="target" data-value="${n}" class="${cfg.target===n?'active':''}" aria-pressed="${cfg.target===n}">${n}</button>`).join('')}</div></div>
 <div class="toggle-row"><div class="toggle-label"><strong>${t('coach')}</strong><small>${t('coachSub')}</small></div><button class="switch ${cfg.coach?'on':''}" data-action="coach" aria-label="${t('coach')}" role="switch" aria-checked="${cfg.coach}"></button></div>
 <button id="start-btn" class="start-btn" data-action="start">${t('start')}<span>→</span></button><p class="no-login">${t('noLogin')}</p></section></div>
 <footer class="intro-footer"><span>${t('footer')} <button class="text-btn" data-action="scores">${t('scores')}</button></span><a href="https://ready-future-hub-life.lovable.app/" target="_blank" rel="noopener noreferrer">FUTURE READY ↗</a></footer></div>`;
}
function resetMatch(){token++;match={score:[0,0],stats:[statsEmpty(),statsEmpty()]};newGame();}
function newGame(){
 token++;s=E.initial();cube={enabled:cfg.cube,value:1,owner:null};player=0;dice=[];pair=[1,1];openingPair=true;phase='opening';selected=null;history=[];result=null;notice='';modal=null;busy=false;rolling=false;hint=null;legal=[];render();
}
function updateLegal(){
 legal=phase==='moving'?E.legalMoves(s,player,dice):[];
 hint=cfg.coach&&cfg.players===1&&player===0&&phase==='moving'&&legal.length?E.bestTurn(s,player,dice)[0]:null;
}
function status(){
 if(phase==='opening')return t(notice==='tie'?'tie':'opening');
 if(phase==='rolling')return openingPair?t('opening'):names(player)+' · '+t('roll');
 if(phase==='done')return t(result?.matchEnd?'matchEnded':'gameWinner');
 if(!human())return t('thinking');
 if(phase==='animating')return t('confirming');
 if(phase==='preroll')return names(player)+' · '+t('rollHelp');
 if(!legal.length)return t(history.length?'confirmHelp':'blocked');
 if(s.bar[player])return t('barHelp');
 if(E.allHome(s,player))return t('offHelp');
 return names(player)+' · '+(!seen?t('move'):dice.length+' '+t('moveNo'));
}
function render(){
 document.documentElement.lang=lang;
 if(phase==='intro')renderIntro();else renderGame();
 renderModal();
}
function renderGame(){
 document.body.style.overflow='hidden';
 const pcard=p=>`<div class="player-card ${player===p&&phase!=='opening'?'active':''}"><div class="avatar ${p?'black':''}"><img src="${HERO}" alt=""></div><div><div class="player-name"><span class="mini-checker ${p?'black':''}"></span>${names(p)}</div><div class="pip-label">${t('pips')} <b data-pip="${p}">${E.pip(s,p)}</b></div></div></div>`;
 const canConfirm=phase==='moving'&&!legal.length;
 const primary=phase==='opening'?'rollStart':phase==='preroll'?'roll':history.length||legal.length?'confirm':'pass';
 const primaryDisabled=!human()&&phase!=='opening'||busy||!['opening','preroll','moving'].includes(phase)||phase==='moving'&&!canConfirm;
 $('#app').innerHTML=`<div class="game ${forced&&portraitPhone()?'forced-landscape':''}">
 <header class="game-header">${pcard(0)}<div class="scorebox"><div class="match-label">${t('match')}: ${t('first')} ${cfg.target} ${t(cfg.cube?'points':'games')}</div><div class="score-line">${names(0)} ${match.score[0]} <span> · </span> ${names(1)} ${match.score[1]}</div></div>${pcard(1)}
 <div class="game-actions"><button data-action="menu">${t('menu')}</button><button data-action="sound" aria-pressed="${sound}">${t('sound')} ${t(sound?'on':'off')}</button><button data-action="qr">QR</button><button data-action="language">${lang==='en'?'ES':'EN'}</button></div></header>
 <div class="board-wrap"><svg class="board-svg" id="board" role="group" aria-label="${lang==='en'?'Backgammon board':'Tablero de backgammon'}"></svg>
 <div class="center-controls"><div class="dice-zone ${rolling?'rolling':''}" id="dice-zone">${renderDice()}</div><div class="action-zone"><button class="undo-btn" data-action="undo" ${history.length&&human()&&phase==='moving'&&!busy?'':'disabled'}>${t('undo')}</button><button class="primary-action" id="primary-action" data-action="primary" ${primaryDisabled?'disabled':''}>${!human()&&phase!=='opening'?t('thinking'):t(primary)}</button></div></div>
 ${cfg.cube?`<div class="cube-ui"><button data-action="double" title="${t('double')}" aria-label="${t('double')} · ${cube.value}" ${E.canDouble(cube,player,phase)&&human()&&!busy?'':'disabled'}>${cube.value}</button><span>${E.canDouble(cube,player,phase)&&human()?t('double'):cube.owner===null?t('center'):names(cube.owner)}</span></div>`:''}
 ${hint?`<div class="guide-pill">${t('try')}</div>`:''}${!seen&&human()&&phase==='moving'&&!legal.length?`<div class="guide-pill confirm-guide">${t('confirmHelp')}</div>`:''}
 </div>
 <footer class="game-footer"><span aria-live="polite">${status()}</span><span class="footer-brand">FUTURE READY</span></footer></div>
 ${portraitPhone()&&!forced?`<div class="rotate-screen"><div><div class="phone-icon"></div><h2>${t('rotate')}</h2><p>${t('rotateBody')}</p><button data-action="rotate">${t('rotateBtn')}</button></div></div>`:''}`;
 drawBoard();
}
function portraitPhone(){return innerWidth<600&&innerHeight>innerWidth&&(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0);}
function renderDice(){
 let counts={};dice.forEach(d=>counts[d]=(counts[d]||0)+1);
 const layouts={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
 return `<div class="dice-pack">${pair.map((d,i)=>{const color=openingPair?i:player;let used=false;if(phase==='moving'||phase==='animating'){used=!counts[d];if(counts[d])counts[d]--;}return `<div class="die ${color?'black':''} ${used?'used':''}" aria-label="${t(color?'black':'white')} ${d}" data-die="${d}">${Array.from({length:9},(_,j)=>`<i class="pip ${layouts[d].includes(j)?'':'empty'}"></i>`).join('')}</div>`;}).join('')}${!openingPair&&pair[0]===pair[1]?`<div class="dice-uses">${Array.from({length:4},(_,i)=>`<i class="use-dot ${i<dice.length?'':'spent'}"></i>`).join('')}</div>`:''}</div>`;
}
function geom(){
 const box=$('.board-wrap').getBoundingClientRect(),rot=forced&&portraitPhone();
 const w=rot?box.height:box.width,h=rot?box.width:box.height;
 const frame=Math.max(13,Math.min(w*.022,h*.045)),tray=Math.max(lang==='es'?43:35,w*.054),bar=Math.max(lang==='es'?42:28,w*.048),left=frame,right=w-frame-tray,usable=right-left-bar,col=usable/12,bx=left+6*col;
 const band=(h*.38-frame-16),r=Math.min(col*.423,(h-frame*2)*.071,band/12),top=frame+16,bottom=h-frame-16,step=r*2;
 return {w,h,frame,tray,bar,left,right,col,bx,r,top,bottom,band,step};
}
function pointX(i,g){const k=i>=13?i-13:12-i;return g.left+(k+.5)*g.col+(k>=6?g.bar:0);}
function stackY(i,n,k,g){const j=Math.min(k,5);return i>=13?g.top+g.r+j*g.step:g.bottom-g.r-j*g.step;}
function coord(point,p,g=boardGeom){
 if(point===0)return {x:g.bx+g.bar/2,y:p===0?g.h*.27:g.h*.73};
 if(point===25)return {x:g.w-g.frame-g.tray*.4,y:p===0?g.h*.73:g.h*.27};
 const n=Math.abs(s.points[point]);return {x:pointX(point,g),y:stackY(point,n,Math.max(0,n-1),g)};
}
function checkerSvg(x,y,r,p,attrs=''){
 return `<g ${attrs}><circle cx="${x}" cy="${y+2}" r="${r}" fill="#1c1008" opacity=".3"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p?'black':'white'}Checker)" stroke="${p?'#0b0d0c':'#a38c64'}" stroke-width="1.2"/><circle cx="${x}" cy="${y-.5}" r="${r*.77}" fill="none" stroke="${p?'#716c60':'#fff9e8'}" stroke-opacity=".55" stroke-width="1.3"/><path d="M ${x-r*.62} ${y-r*.37} Q ${x} ${y-r*.94} ${x+r*.56} ${y-r*.42}" fill="none" stroke="${p?'#aaa294':'#fffef5'}" stroke-width="2" stroke-linecap="round" opacity=".55"/></g>`;
}
function drawBoard(){
 const svg=$('#board');if(!svg)return;const g=geom();boardGeom=g;const {w,h,frame,bar,bx,left,right,col,r,top,bottom}=g;
 const cubeElement=$('.cube-ui');if(cubeElement)cubeElement.style.left=(bx+bar/2)+'px';
 svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const legalFrom=new Set(legal.map(m=>m.from));const destinations=selected===null?[]:legal.filter(m=>m.from===selected).map(m=>m.to);
 let html=`<defs>
 <linearGradient id="wood" x2="0" y2="1"><stop stop-color="#8d542e"/><stop offset=".26" stop-color="#653d25"/><stop offset=".5" stop-color="#9b6237"/><stop offset=".7" stop-color="#724022"/><stop offset="1" stop-color="#4d2e20"/></linearGradient>
 <linearGradient id="felt" x2=".8" y2="1"><stop stop-color="#d7b87b"/><stop offset=".5" stop-color="#c4a16c"/><stop offset="1" stop-color="#e0c18b"/></linearGradient>
 <linearGradient id="pointTan" x2="1" y2=".3"><stop stop-color="#e5c894"/><stop offset=".5" stop-color="#f3d8a7"/><stop offset="1" stop-color="#d2ae74"/></linearGradient>
 <linearGradient id="pointBrown" x2="1" y2=".2"><stop stop-color="#65432c"/><stop offset=".5" stop-color="#98643b"/><stop offset="1" stop-color="#6a4329"/></linearGradient>
 <radialGradient id="whiteChecker" cx=".32" cy=".2" r=".83"><stop stop-color="#fffef8"/><stop offset=".43" stop-color="#f0e9d7"/><stop offset=".82" stop-color="#d4c7ad"/><stop offset=".93" stop-color="#ad9873"/><stop offset="1" stop-color="#e0cfab"/></radialGradient>
 <radialGradient id="blackChecker" cx=".3" cy=".19" r=".85"><stop stop-color="#75726b"/><stop offset=".32" stop-color="#3b3b35"/><stop offset=".73" stop-color="#1b1d19"/><stop offset=".93" stop-color="#080b09"/><stop offset="1" stop-color="#45463b"/></radialGradient>
 <pattern id="grain" width="280" height="36" patternUnits="userSpaceOnUse"><path d="M0 3 Q80 12 160 3T320 3M0 10Q80 19 160 10T320 10M0 15Q100 28 200 15T400 15M0 27Q60 15 120 27T300 27M0 34Q100 22 200 34T400 34" stroke="#2e160a" stroke-width=".65" fill="none" opacity=".22"/><path d="M0 8Q80 16 160 8T320 8M0 30Q100 19 200 30T400 30" stroke="#f4cf8f" stroke-width=".7" opacity=".17" fill="none"/></pattern>
 <filter id="insetShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".28"/></filter>
 </defs>
 <rect width="${w}" height="${h}" fill="url(#wood)"/><rect width="${w}" height="${h}" fill="url(#grain)"/>
 <rect x="5" y="5" width="${w-10}" height="${h-10}" rx="9" fill="none" stroke="#bf8e50" stroke-width="2" opacity=".65"/>
 <rect x="${left-2}" y="${frame-2}" width="${right-left+4}" height="${h-2*frame+4}" rx="5" fill="#3d271b"/>
 <rect x="${left}" y="${frame}" width="${right-left}" height="${h-2*frame}" rx="3" fill="url(#felt)" filter="url(#insetShadow)"/>
 <rect x="${left}" y="${frame}" width="${right-left}" height="${h-2*frame}" fill="url(#grain)" opacity=".32"/>
 <rect x="${bx}" y="${frame}" width="${bar}" height="${h-frame*2}" fill="url(#wood)" stroke="#4b2f1e" stroke-width="2"/><rect x="${bx+4}" y="${frame}" width="${bar-8}" height="${h-frame*2}" fill="url(#grain)"/>
 <path d="M${bx+4} ${frame}V${h-frame}M${bx+bar-4} ${frame}V${h-frame}" stroke="#bc8e51" opacity=".45"/>
 <rect x="${bx+bar*.23}" y="${frame+3}" width="${bar*.54}" height="6" rx="2" fill="#bc9753"/><rect x="${bx+bar*.23}" y="${h-frame-9}" width="${bar*.54}" height="6" rx="2" fill="#bc9753"/>`;
 for(let i=1;i<=24;i++){
  const x=pointX(i,g),up=i>=13,y=up?top-1:bottom+1,tip=up?h*.395:h*.605;
  const rel=relativeLabel(i);
  html+=`<g class="point" data-point="${i}" role="button" tabindex="0" aria-label="${lang==='en'?'Point':'Punto'} ${rel}"><rect x="${x-col/2}" y="${up?frame:h*.59}" width="${col}" height="${h*.41-frame}" fill="transparent"/>
  <path d="M${x-col*.46} ${y}L${x+col*.46} ${y}L${x} ${tip}Z" fill="url(#${i%2?'pointTan':'pointBrown'})" stroke="${i%2?'#b59158':'#59351e'}" stroke-width=".6"/>
  <path d="M${x-col*.46+3} ${y}L${x} ${tip- (up?6:-6)}" stroke="#fff5cb" stroke-opacity=".13" fill="none"/>
  <text x="${x}" y="${up?frame+12:h-frame-3}" text-anchor="middle" fill="#513821" font-size="12" font-weight="800">${rel}</text>`;
  if(destinations.includes(i))html+=`<circle class="destination" cx="${x}" cy="${up?h*.35:h*.65}" r="${Math.max(r*.75,10)}"/>`;
  const n=Math.abs(s.points[i]),p=s.points[i]>0?0:1;
  for(let k=0;k<n;k++){
   const y=stackY(i,n,k,g),isTop=k===n-1;
   html+=checkerSvg(x,y,r,p,`class="checker ${isTop&&human()&&legalFrom.has(i)?'selectable':''} ${selected===i?'selected':''}" data-from="${i}"`);
   if(isTop&&human()&&legalFrom.has(i))html+=`<circle cx="${x}" cy="${y}" r="${r+2}" fill="none" stroke="${selected===i?'#d9fc86':'#fbe49e'}" stroke-width="${selected===i?3:2}" opacity=".9" pointer-events="none"/>`;
   if(isTop&&hint?.from===i)html+=`<circle cx="${x}" cy="${y}" r="${r+3}" class="hint-ring"/>`;
  }
  if(n>6){const y=stackY(i,n,n-1,g);html+=`<text x="${x}" y="${y+4}" fill="${p?'#fff9e8':'#3d3327'}" text-anchor="middle" class="badge-number">${n}</text>`;}
  html+='</g>';
 }
 for(let p=0;p<2;p++){
  const b=coord(0,p,g),o=coord(25,p,g),n=s.bar[p],ty=p===0?h*.59:frame+4,th=h*.41-frame-4;
  html+=`<g ${p===player?'data-point="25"':''} class="point" role="button" tabindex="0" aria-label="${t('tray')} ${names(p)}"><rect x="${right+7}" y="${ty}" width="${w-right-frame-8}" height="${th}" rx="5" fill="#37251b" stroke="#b18b55"/><text x="${o.x}" y="${p===0?h-frame-7:frame+17}" fill="#edce93" font-size="12" font-weight="900" text-anchor="middle">${s.off[p]}</text><text x="${o.x}" y="${p===0?h-frame-21:frame+31}" fill="#edce93" font-size="12" font-weight="900" text-anchor="middle">${t('tray')}</text>`;
  for(let k=0;k<s.off[p];k++)html+=`<rect x="${right+11}" y="${p===0?h-frame-36-k*Math.min(7,(th-48)/15):frame+39+k*Math.min(7,(th-48)/15)}" width="${w-right-frame-16}" height="5" rx="2" fill="${p?'#252923':'#eadfc6'}" stroke="${p?'#6d6b58':'#fff5de'}" stroke-width=".6"/>`;
  if(destinations.includes(25)&&player===p)html+=`<rect class="destination" x="${right+8}" y="${ty+3}" width="${w-right-frame-10}" height="${th-6}" rx="5"/>`;
  html+='</g>';
  html+=`<g ${p===player?'data-from="0" data-point="0"':''} role="button" tabindex="0" aria-label="${t('bar')} ${names(p)} ${n}"><rect x="${bx+1}" y="${p===0?frame:h*.59}" width="${bar-2}" height="${h*.4-frame}" fill="transparent"/>`;
  if(n){const rr=Math.min(r,bar*.4);for(let k=0;k<Math.min(n,3);k++)html+=checkerSvg(b.x,b.y+(k-1)*rr*.6,rr,p,`class="checker ${player===p&&human()?'selectable':''}" ${p===player?'data-from="0"':''}`);html+=`<text x="${b.x}" y="${b.y+4}" fill="${p?'#fff':'#392e21'}" font-size="12" font-weight="900" text-anchor="middle">${n}</text>`;if(hint?.from===0&&p===player)html+=`<circle cx="${b.x}" cy="${b.y}" r="${rr+3}" class="hint-ring"/>`;}
  html+=`<text x="${b.x}" y="${p===0?frame+24:h-frame-17}" fill="#efd7aa" font-size="12" text-anchor="middle">${t('bar')}</text></g>`;
 }
 if(hint){const a=coord(hint.to,player,g);html+=`<circle cx="${a.x}" cy="${a.y}" r="${r+4}" class="hint-ring" stroke-dasharray="4 4"/>`;}
 svg.innerHTML=html;
}
const relativeLabel=i=>player===1?25-i:i;
async function roll(){
 if(!['opening','preroll'].includes(phase)||busy)return;
 const opening=phase==='opening',tk=token;busy=true;phase='rolling';rolling=true;openingPair=opening;soundPlay('roll');render();
 const a=randomDie(),b=randomDie();
 const timer=setInterval(()=>{pair=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];const dz=$('#dice-zone');if(dz)dz.innerHTML=renderDice();},Math.max(20,85*fast));
 await sleep(950);clearInterval(timer);if(tk!==token)return;
 pair=[a,b];rolling=false;busy=false;
 if(opening){const res=E.opening(a,b);if(!res){phase='opening';notice='tie';render();return;}player=res.player;dice=res.dice;}
 else dice=E.rollDice(a,b);
 phase='moving';history=[];selected=null;notice='';updateLegal();render();
 if(!human())aiMoves(tk);
}
function clientCoord(pt,p){
 const svg=$('#board'),pos=coord(pt,p);const matrix=svg.getScreenCTM();return new DOMPoint(pos.x,pos.y).matrixTransform(matrix);
}
function burstAt(x,y,type='hit'){
 const colors=type==='hit'?['#f6ce6b','#f59855','#fff0af']:['#d3eb87','#f9d579','#f5fff0'];
 for(let i=0;i<12;i++){const el=document.createElement('i');el.className='burst';el.style.cssText=`left:${x}px;top:${y}px;--c:${colors[i%3]};--dx:${Math.cos(i*Math.PI/6)*(25+Math.random()*35)}px;--dy:${Math.sin(i*Math.PI/6)*(25+Math.random()*35)}px`;document.body.append(el);setTimeout(()=>el.remove(),800);}
}
async function doMove(m,ai=false){
 if(phase!=='moving'||busy||!legal.some(x=>x.from===m.from&&x.to===m.to&&x.die===m.die)||!ai&&!human())return false;
 const tk=token,p=player,from=clientCoord(m.from,p),to=clientCoord(m.to,p),hit=m.to!==25&&s.points[m.to]===-E.sign(p);
 history.push({s:E.clone(s),dice:[...dice]});busy=true;phase='animating';selected=null;
 const fly=document.createElement('div');fly.className='flying-checker '+(p?'black':'white');const rr=boardGeom.r;fly.style.cssText=`left:${from.x-rr}px;top:${from.y-rr}px;width:${rr*2}px;height:${rr*2}px`;document.body.append(fly);
 soundPlay('click');render();
 const anim=fly.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${(to.x-from.x)*.55}px,${(to.y-from.y)*.55-12}px) scale(1.08)`,offset:.55},{transform:`translate(${to.x-from.x}px,${to.y-from.y}px) scale(1)`}],{duration:Math.max(1,260*fast),easing:'ease-in-out',fill:'forwards'});
 await anim.finished.catch(()=>{});fly.remove();if(tk!==token)return false;
 s=E.apply(s,p,m);dice=E.removeDie(dice,m.die);phase='moving';busy=false;E.invariant(s);updateLegal();render();
 if(hit){soundPlay('hit');burstAt(to.x,to.y,'hit');}else if(m.to===25){soundPlay('off');burstAt(to.x,to.y,'off');}else soundPlay('click');
 return true;
}
function undo(){
 if(!history.length||phase!=='moving'||busy||!human())return;const old=history.pop();s=old.s;dice=old.dice;selected=null;updateLegal();soundPlay('click');render();
}
function confirm(){
 if(phase!=='moving'||busy||legal.length)return;
 if(human()&&!seen){seen=true;storage.set('guided',true);}
 if(s.off[player]===15){finish(player,E.winType(s,player));return;}
 player=1-player;phase='preroll';history=[];dice=[];selected=null;hint=null;legal=[];openingPair=false;render();
 if(!human())aiTurn(token);
}
async function aiTurn(tk){
 await sleep(1000);if(tk!==token||phase!=='preroll'||human())return;
 if(E.canDouble(cube,player,phase)&&E.cubeEquity(s,player)>.23&&match.score[player]+cube.value<cfg.target){offerDouble();return;}
 await roll();
}
async function aiMoves(tk){
 await sleep(1000);if(tk!==token||human()||phase!=='moving')return;
 const moves=E.bestTurn(s,player,dice);
 for(const m of moves){if(tk!==token||phase!=='moving')return;await doMove(m,true);await sleep(330);}
 if(tk!==token)return;await sleep(400);confirm();
}
function offerDouble(){
 if(!E.canDouble(cube,player,phase)||busy)return;
 soundPlay('cube');modal={kind:'double',offerer:player};renderModal();
 if(cfg.players===1&&player===0){const tk=token;sleep(1100).then(()=>{if(tk!==token||modal?.kind!=='double')return;respondDouble(E.cubeEquity(s,1)>-.55);});}
}
function respondDouble(accept){
 if(modal?.kind!=='double')return;const offerer=modal.offerer;modal=null;
 if(accept){cube=E.acceptDouble(cube,offerer);notice='accepted';soundPlay('cube');render();if(!human())sleep(500).then(()=>{if(phase==='preroll'&&!human())roll();});}
 else finish(offerer,1,true);
}
function finish(winner,type,declined=false){
 const value=E.pointsWon(cfg.cube,cube.value,type,declined),st=match.stats[winner],lt=lifetime[winner];
 for(const a of [st,lt]){a.games++;a.points+=value;if(!declined&&type===2)a.gammons++;if(!declined&&type===3)a.backgammons++;}
 match.score[winner]+=value;const matchEnd=match.score[winner]>=cfg.target;
 if(matchEnd){st.matches++;lt.matches++;}
 storage.set('scores',lifetime);phase='done';busy=false;legal=[];hint=null;history=[];result={winner,type,declined,value,matchEnd};modal={kind:'win'};soundPlay('win');render();confetti(type===1&&!matchEnd?45:110);
}
function confetti(n){const wrap=document.createElement('div');wrap.className='confetti';const colors=['#e7bf63','#d7e79a','#f2805c','#6bb8a6','#f6e9cf'];wrap.innerHTML=Array.from({length:n},(_,i)=>`<i style="--x:${Math.random()*100}%;--d:${Math.random()*.9}s;--r:${Math.random()*360}deg;--c:${colors[i%5]}"></i>`).join('');document.body.append(wrap);setTimeout(()=>wrap.remove(),3900);}
function table(stats,full=false){
 const rows=[['wins','games'],['gammons','gammons'],['backgammons','backgammons'],...(cfg.cube||full?[['totalPoints','points']]:[]),...(full?[['matches','matches']]:[])];
 return `<table class="tally"><thead><tr><th>${t('final')}</th><th>${names(0)}</th><th>${names(1)}</th></tr></thead><tbody>${rows.map(([key,prop])=>`<tr><td>${t(key)}</td><td>${stats[0][prop]}</td><td>${stats[1][prop]}</td></tr>`).join('')}</tbody></table>`;
}
const modalBtn=(label,action,main=false)=>`<button data-action="${action}" class="${main?'main':''}">${t(label)}</button>`;
function renderModal(){
 $('#app').inert=!!modal;
 if(!modal){$('#overlay').innerHTML='';return;}
 let content='',extra='';
 if(modal.kind==='qr'){
  const url=location.href.split('#')[0].split('?')[0],qr=qrcode(0,'M');qr.addData(url);qr.make();
  content=`<button class="close-btn" data-action="close">${t('close')}</button><h2>${t('qrTitle')}</h2><p>${t('scan')}</p><div class="qr-code" data-qr-url="${esc(url)}">${qr.createSvgTag({cellSize:6,margin:2,scalable:true})}</div><div class="qr-url">${esc(url)}</div>`;extra='qr-modal';
 }else if(modal.kind==='double'){
  const aiResponse=cfg.players===1&&modal.offerer===0;
  content=`<div class="win-kicker">${t('cube')} ${cube.value} → ${cube.value*2}</div><h2>${t('doubleTitle')}</h2><p>${names(modal.offerer)} ${t('doubleBody')} <b>${cube.value*2}</b>.</p><p>${t('declineNote')}</p>${aiResponse?`<p>${t('thinking')}</p>`:`<div class="modal-actions">${modalBtn('accept','accept',true)}${modalBtn('decline','decline')}</div>`}`;
 }else if(modal.kind==='win'){
  const unit=result.value===1?(lang==='en'?(cfg.cube?'point':'win'):(cfg.cube?'punto':'victoria')):t(cfg.cube?'points':'games');
  content=`<img class="win-art" src="${HERO}" alt=""><div class="win-kicker">${t(result.matchEnd?'matchWinner':'gameWinner')}</div><h2>${names(result.winner)} ${t('win')}</h2><p>${t(result.declined?'declined':result.type===3?'backgammon':result.type===2?'gammon':'single')} · +${result.value} ${unit}</p>${table(match.stats)}<div class="modal-actions">${result.matchEnd?modalBtn('again','again',true):modalBtn('next','next',true)}${modalBtn('change','intro')}${modalBtn('menu','menu-from-win')}</div>`;
 }else if(modal.kind==='menu'){
  content=`<h2>${t('menu')}</h2><p>${phase==='done'?t('matchEnded'):status()}</p><div class="modal-actions">${phase!=='done'?modalBtn('resume','close',true):modalBtn('again','again',true)}${modalBtn('intro','intro')}</div><div class="modal-actions">${modalBtn('scores','scores')}${modalBtn('how','rules')}</div><div class="modal-actions">${modalBtn('reset','reset')}</div>`;
 }else if(modal.kind==='scores'){
  content=`<button class="close-btn" data-action="close">${t('close')}</button><h2>${t('scores')}</h2>${table(lifetime,true)}<div class="modal-actions">${modalBtn('reset','reset')}</div>`;
 }else if(modal.kind==='reset'){
  content=`<h2>${t('resetQuestion')}</h2><p>${t('resetBody')}</p><div class="modal-actions">${modalBtn('cancel','scores')}${modalBtn('resetYes','reset-yes',true)}</div>`;
 }else if(modal.kind==='rules'){
  content=`<button class="close-btn" data-action="close">${t('close')}</button><h2>${t('how')}</h2><div style="text-align:left">${rules()}</div>`;
 }
 $('#overlay').innerHTML=`<div class="modal-backdrop"><section class="modal ${extra}" role="dialog" aria-modal="true" aria-label="${t(modal.kind==='win'?'gameWinner':modal.kind==='qr'?'qrTitle':modal.kind==='double'?'doubleTitle':'menu')}">${content}</section></div>`;
}
function toIntro(){token++;phase='intro';modal=null;busy=false;rolling=false;forced=false;render();}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');if(!button||button.disabled)return;
 const action=button.dataset.action,v=button.dataset.value;
 if(action==='sound'){sound=!sound;if(!sound&&audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;}persist();render();if(sound)soundPlay();}
 else if(action==='language'){lang=lang==='en'?'es':'en';persist();render();}
 else if(action==='qr'){modal={kind:'qr'};renderModal();}
 else if(action==='players'){cfg.players=+v;persist();render();}
 else if(action==='cube-mode'){cfg.cube=v==='true';if(cfg.cube&&cfg.target===1)cfg.target=3;persist();render();}
 else if(action==='target'){cfg.target=+v;persist();render();}
 else if(action==='coach'){cfg.coach=!cfg.coach;persist();render();}
 else if(action==='start'){soundPlay();resetMatch();}
 else if(action==='primary'){if(phase==='opening'||phase==='preroll')roll();else if(phase==='moving')confirm();}
 else if(action==='undo')undo();
 else if(action==='double')offerDouble();
 else if(action==='accept')respondDouble(true);
 else if(action==='decline')respondDouble(false);
 else if(action==='close'){modal=phase==='done'?{kind:'win'}:null;renderModal();}
 else if(action==='menu'||action==='menu-from-win'){modal={kind:'menu'};renderModal();}
 else if(['scores','reset','rules'].includes(action)){modal={kind:action};renderModal();}
 else if(action==='reset-yes'){lifetime=[statsEmpty(),statsEmpty()];storage.set('scores',lifetime);modal={kind:'scores'};renderModal();}
 else if(action==='intro')toIntro();
 else if(action==='again')resetMatch();
 else if(action==='next')newGame();
 else if(action==='rotate'){forced=true;render();}
});
let pointer=null,ghost=null;
function choose(from){if(phase!=='moving'||busy||!human()||!legal.some(m=>m.from===from))return;selected=from;drawBoard();}
function destMove(to){if(selected===null)return false;const moves=legal.filter(m=>m.from===selected&&m.to===to);if(!moves.length)return false;const m=moves.sort((a,b)=>b.die-a.die)[0];doMove(m);return true;}
document.addEventListener('pointerdown',e=>{
 const board=e.target.closest('#board');if(!board||modal||phase!=='moving'||busy||!human())return;
 const pt=e.target.closest('[data-point]'),checker=e.target.closest('[data-from]'),to=pt?+pt.dataset.point:null;
 if(selected!==null&&to!==null&&legal.some(m=>m.from===selected&&m.to===to)){destMove(to);e.preventDefault();return;}
 if(checker){const from=+checker.dataset.from;if(!legal.some(m=>m.from===from))return;pointer={id:e.pointerId,from,x:e.clientX,y:e.clientY,drag:false};choose(from);e.preventDefault();}
});
document.addEventListener('pointermove',e=>{
 if(!pointer||pointer.id!==e.pointerId)return;
 if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6)pointer.drag=true;
 if(pointer.drag){if(!ghost){ghost=document.createElement('div');ghost.className='flying-checker '+(player?'black':'white');document.body.append(ghost);}const r=boardGeom.r;ghost.style.cssText=`left:${e.clientX-r}px;top:${e.clientY-r}px;width:${r*2}px;height:${r*2}px`;e.preventDefault();}
},{passive:false});
document.addEventListener('pointerup',e=>{
 if(!pointer||pointer.id!==e.pointerId)return;
 if(pointer.drag){ghost?.remove();ghost=null;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-point]');if(target)destMove(+target.dataset.point);}
 pointer=null;
});
document.addEventListener('pointercancel',()=>{pointer=null;ghost?.remove();ghost=null;});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&modal&&modal.kind!=='double'){modal=phase==='done'?{kind:'win'}:null;renderModal();}
 if(e.key==='Enter'||e.key===' '){const el=e.target.closest('[data-point]');if(el){e.preventDefault();const pt=+el.dataset.point;if(!destMove(pt))choose(pt);}}
});
let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(phase!=='intro')renderGame();},100);});
window.render_game_to_text=()=>JSON.stringify({phase,player,players:cfg.players,cube,setup:cfg,state:s,dice,pair,openingPair,legal,selected,hint,score:match?.score,result,history:history.length,coordinateSystem:'Physical points 1..24. White moves down toward 1; Black up toward 24; bar=0; off=25.'});
window.advanceTime=async(ms)=>{await sleep(Math.min(ms,100));};
if(['127.0.0.1','localhost'].includes(location.hostname))window.__test={
 get:()=>({s,phase,player,dice,cube,match,cfg,legal,hint,seen,lifetime}),
 fast(v=.01){fast=v;},
 rolls(v){queuedRolls=[...v];},
 stage(v){token++;busy=false;rolling=false;modal=null;if(v.s)s=E.clone(v.s);if(v.player!==undefined)player=v.player;if(v.dice)dice=[...v.dice];if(v.phase)phase=v.phase;if(v.cfg)cfg={...cfg,...v.cfg};if(v.cube)cube={...cube,...v.cube};if(v.score)match.score=[...v.score];history=[];selected=null;pair=v.pair||dice.slice(0,2);if(pair.length<2)pair=[1,1];openingPair=false;updateLegal();render();},
 start:resetMatch,roll,confirm,move:doMove,undo,finish,E
};
render();
