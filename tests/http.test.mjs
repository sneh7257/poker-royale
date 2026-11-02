// Independent HTTP clients. Run with BASE_URL set to a running deployment.
import assert from 'node:assert/strict';
const base=process.env.BASE_URL;if(!base)throw Error('BASE_URL is required');
let checks=0;function ok(name,fn){fn();checks++;console.log('PASS '+name)}
async function request(session,body,query=''){const r=await fetch(base+'/api/game'+query,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?{Authorization:'Bearer '+session.token}:{})},body:body?JSON.stringify(body):undefined});const data=await r.json();return{status:r.status,data};}
async function send(s,b,q){const r=await request(s,b,q);assert.equal(r.status,200,JSON.stringify(r.data));return r.data}
const names=['QA Host','QA Rival','QA Third','QA Spectator'];const clients=[];for(const name of names)clients.push(await send(null,{type:'session',profile:{nickname:name}}));
const [a,b,c,watch]=clients;
const created=await send(a,{type:'create',name:'Automated verification',private:true,capacity:3});const code=created.code;
for(const p of [b,c])await send(p,{type:'join',code});await send(watch,{type:'join',code,spectate:true});
const get=s=>send(s,null,'?code='+code);
const lobby=await get(a);ok('three independent players and spectator share a persistent room',()=>{assert.equal(lobby.players.length,3);assert.equal(lobby.spectatorCount,1)});
const list=await send(null,null,'?type=rooms');ok('private table excluded from public browser',()=>assert.ok(!list.rooms.some(r=>r.code===code)));
const started=await send(a,{type:'start',code});
const duplicatePayload={type:'act',code,action:started.legal.check?'check':'call',hand:started.hand,turn:started.turn};const duplicate=await Promise.all([request(a,duplicatePayload),request(a,duplicatePayload)]);ok('duplicate concurrent action applied exactly once',()=>{assert.equal(duplicate.filter(r=>r.status===200).length,1,JSON.stringify(duplicate.map(r=>r.data)));assert.equal(duplicate.filter(r=>r.status!==200).length,1)});
let snapshots=await Promise.all(clients.map(get));
ok('same board, hand, turn and chip balances across clients',()=>{for(const s of snapshots){assert.equal(s.hand,snapshots[0].hand);assert.equal(s.turn,snapshots[0].turn);assert.deepEqual(s.board,snapshots[0].board);assert.deepEqual(s.players.map(p=>p.chips),snapshots[0].players.map(p=>p.chips))}});
ok('each player receives only their own private cards',()=>{for(let i=0;i<3;i++){assert.equal(snapshots[i].players.find(p=>p.id===clients[i].id).cards.length,2);assert.ok(snapshots[i].players.filter(p=>p.id!==clients[i].id).every(p=>p.cards.length===0));assert.ok(!('deck'in snapshots[i]));}});
ok('spectator receives no hole cards or undealt deck',()=>{assert.ok(snapshots[3].players.every(p=>p.cards.length===0));assert.ok(!('deck'in snapshots[3]));assert.ok(!('reports'in snapshots[3]));});
const unauth=await request(null,null,'?code='+code);ok('unauthenticated state access rejected',()=>assert.equal(unauth.status,400));
const nonActor=clients.find(s=>s.id!==snapshots[0].players[snapshots[0].actor].id);const rejected=await request(nonActor,{type:'act',code,action:'allin',hand:1,turn:snapshots[0].turn});ok('out-of-turn action rejected',()=>assert.equal(rejected.status,400));
const spectatorAction=await request(watch,{type:'act',code,action:'allin',hand:1,turn:snapshots[0].turn});ok('spectator cannot act',()=>assert.equal(spectatorAction.status,400));
const fresh=await get(b);ok('reconnection with original credential restores seat and cards',()=>{const p=fresh.players.find(p=>p.id===b.id);assert.equal(p.cards.length,2);assert.equal(fresh.players.length,3)});
await send(a,{type:'pause',code});const paused=await get(b);ok('host pause synchronized to rival',()=>{assert.ok(paused.pausedAt);assert.equal(paused.legal,null)});const forbidden=await request(b,{type:'resume',code});ok('non-host cannot resume a private tournament',()=>assert.equal(forbidden.status,400));await send(a,{type:'resume',code});
await send(c,{type:'chat',code,text:'Hello table 👑'});const chat=await get(b);ok('chat crosses independent sessions',()=>assert.equal(chat.chat.at(-1).text,'Hello table 👑'));
// Stop sending requests as host. Rival alone drives expiry retrieval; server chooses timeout.
let before=await get(b);console.log('Waiting for server deadline, with host client disconnected…');await new Promise(r=>setTimeout(r,Math.max(0,before.deadline-Date.now())+150));const after=await get(b);ok('server timeout advances without host client',()=>assert.ok(after.turn>before.turn));
let r=after;let count=0;while(r.status==='playing'&&count++<90){if(r.street==='showdown'){await new Promise(resolve=>setTimeout(resolve,Math.max(0,r.deadline-Date.now())+50));r=await get(b);continue;}const player=clients.find(s=>s.id===r.players[r.actor].id);const state=await get(player),l=state.legal;const action=l.canRaise?'allin':l.check?'check':'call';r=await send(player,{type:'act',code,action,hand:state.hand,turn:state.turn});}
ok('complete tournament produces one champion and conserves all chips',()=>{assert.equal(r.status,'finished');assert.equal(r.players.filter(p=>p.place===1).length,1);assert.equal(r.players.reduce((n,p)=>n+p.chips,0),30000)});
const results=await send(a,null,'?type=stats');ok('statistics derived on server from completed tournament',()=>{assert.ok(results.tournaments>=1);assert.ok(results.hands>=1)});
const botTable=await send(a,{type:'create',name:'Bot vote verification',private:true,capacity:4});
await send(b,{type:'join',code:botTable.code});await send(c,{type:'join',code:botTable.code});await send(watch,{type:'join',code:botTable.code,spectate:true});
const proposal=await send(a,{type:'bots-propose',code:botTable.code,count:1});
ok('host bot proposal remains pending until a human majority votes',()=>{assert.ok(proposal.botVote);assert.equal(proposal.botCount,0)});
const spectatorVote=await request(watch,{type:'bots-vote',code:botTable.code,yes:true});
ok('spectator cannot vote on adding bots',()=>assert.equal(spectatorVote.status,400));
const botAdded=await send(b,{type:'bots-vote',code:botTable.code,yes:true});
ok('human majority adds the approved number of bots',()=>{assert.equal(botAdded.botCount,1);assert.equal(botAdded.botVote,null);assert.equal(botAdded.players.filter(p=>p.isBot).length,1)});
const botStarted=await send(a,{type:'start',code:botTable.code});
ok('server runs a bot turn and withholds its private cards',()=>{const bot=botStarted.players.find(p=>p.isBot);assert.ok(bot);assert.ok(['Fold','Call 100','Raise to 300'].includes(bot.last));assert.equal(bot.cards.length,0)});
console.log(JSON.stringify({checks,code,players:3,spectators:1,completed:true}));
