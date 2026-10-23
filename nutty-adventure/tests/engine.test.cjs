/* Run with: node --test tests/engine.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Game, Progress, LEVELS, GOAL, cleanSave } = require('../engine.js');
function seeded(seed=42) { return () => { seed = (seed*1664525+1013904223)>>>0; return seed/4294967296; }; }
function memory() { const map=new Map(); return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}; }
function autoPlay(game, dt=1/60) {
  let steps=0;
  while(game.state==='playing' && steps++ < 180/dt) {
    // Track the next actual landing, with the same capped speed as the player.
    const next=game.nuts.filter(n=>n.y<=game.catchY+18).sort((a,b)=>(a.flight-a.age)-(b.flight-b.age))[0];
    game.update(dt,{targetX:next?next.target:game.player.x});
  }
  return steps*dt;
}

test('all five complete at exactly 15, at desktop and phone sizes, across seeded patterns',()=>{
  for(const [width,height] of [[1200,660],[600,860]]) for(let seed=1;seed<=8;seed++) for(let level=0;level<5;level++) {
    const events=[]; const g=new Game({width,height,random:seeded(seed),emit:(event,data)=>events.push({event,data})});
    g.start(level); const duration=autoPlay(g);
    assert.equal(g.state,'level-complete',`${width}px level ${level+1}, seed ${seed}, lives ${g.lives}, score ${g.score}`);
    assert.equal(g.score,GOAL); assert.ok(g.lives>0);assert.equal(g.nuts.length,0);assert.equal(g.extraThrows.length,0);
    assert.equal(events.filter(e=>e.event==='complete').length,1);
    assert.equal(events.filter(e=>e.event==='catch').length,15);
    for(const e of events.filter(e=>e.event==='throw'))assert.equal(e.data.type,LEVELS[level].nut);
    const score=g.score;g.update(1);assert.equal(g.score,score);assert.ok(duration<100);
  }
});
test('throws originate at the rabbit paw and different levels use their own trajectories',()=>{
  for(let level=0;level<5;level++){
    let count=0;let g;
    g=new Game({random:seeded(25),emit:(type,n)=>{if(type==='throw'){assert.equal(n.startX,g.rabbit.x+47);assert.equal(n.startY,g.throwY);assert.equal(n.age,0);if(level===2)assert.ok(n.zigzag>0);if(level<2)assert.equal(n.zigzag,0);count++;}}});
    g.start(level);autoPlay(g);assert.ok(count>=15);
  }
});
test('catch zone accepts a nut inside the basket and rejects one outside',()=>{
  for(const offset of [0,60,130]){
    const g=new Game();g.start();g.spawnTimer=999;
    const x=g.player.x+offset;
    g.nuts=[{id:1,type:'almond',x,y:g.catchY-5,startX:x,startY:g.catchY-5,target:x,age:0,flight:1,vy:400,gravity:0,vx:0,angle:0,spin:0,zigzag:0}];
    g.update(1/60);
    assert.equal(g.score,offset<=72?1:0);
    if(offset>72){for(let i=0;i<30;i++)g.update(1/60);assert.equal(g.lives,4);assert.equal(g.score,0);}
  }
});
test('five missed nuts cost five hearts, then retry restores the current level',()=>{
  const g=new Game({random:seeded()});g.start(3);
  for(let i=0;i<12000&&g.state==='playing';i++){
    const next=g.nuts[0];const target=next&&next.target<g.width/2?g.width-g.margin:g.margin;g.update(1/60,{targetX:target});
  }
  assert.equal(g.state,'game-over');assert.equal(g.lives,0);assert.equal(g.level,3);
  g.start(g.level);assert.equal(g.level,3);assert.equal(g.lives,5);assert.equal(g.score,0);assert.equal(g.state,'playing');
});
test('pause freezes movement, throws and nut physics; resume continues',()=>{
  const g=new Game();g.start();for(let i=0;i<160;i++)g.update(1/60);
  g.pause();const before=JSON.stringify(g);for(let i=0;i<100;i++)g.update(.05,{axis:1});assert.equal(JSON.stringify(g),before);
  g.resume();g.update(.05,{axis:1});assert.equal(g.state,'playing');assert.ok(g.player.x>g.width/2);
});
test('movement clamps to both field edges, with a capped drag speed',()=>{
  const g=new Game();g.start();g.spawnTimer=999;g.update(.05,{targetX:9999});assert.equal(g.player.x,g.width/2+g.playerSpeed*.05);
  for(let i=0;i<100;i++)g.update(.05,{axis:1});assert.equal(g.player.x,g.width-g.margin);
  for(let i=0;i<100;i++)g.update(.05,{axis:-1});assert.equal(g.player.x,g.margin);
});
test('patterns have similar outcomes at 30, 60 and 120 updates per second',()=>{
  for(const fps of [30,60,120])for(let i=0;i<5;i++){
    const g=new Game({random:seeded(9)});g.start(i);autoPlay(g,1/fps);assert.equal(g.state,'level-complete',`level ${i+1} at ${fps}fps`);assert.equal(g.score,15);
  }
});
test('complete journey persists five unique rewards and the replayable finale',()=>{
  const storage=memory();let p=new Progress(storage);
  for(let i=0;i<5;i++){
    const g=new Game({random:seeded(i+1),emit:(event,data)=>{if(event==='complete')p.complete(data.level);}});g.start(i);autoPlay(g);
    assert.equal(p.data.pending,i);const before=p.data.rewards.length;
    p=new Progress(storage);assert.equal(p.data.pending,i);assert.equal(p.data.rewards.length,before);
    p.reward(i);p.reward(i);assert.equal(p.data.rewards.length,i+1);assert.equal(p.data.pending,null);
    p=new Progress(storage);assert.equal(p.unlocked,Math.min(5,i+2));
  }
  assert.equal(p.data.victory,true);assert.deepEqual(p.data.rewards,[0,1,2,3,4]);
  const failed=new Game();failed.start(4);failed.lives=0;assert.equal(new Progress(storage).data.rewards.length,5);
});
test('malformed or unavailable storage never prevents play',()=>{
  assert.deepEqual(cleanSave({completed:999,rewards:[0,0,4,44,'2'],pending:-1}).rewards,[0,4]);
  const broken=new Progress({getItem:()=>'{garbage',setItem:()=>{throw Error('blocked');}});assert.equal(broken.data.completed,0);assert.equal(broken.save(),false);
  const unavailable=new Progress(null);unavailable.complete(0);unavailable.reward(0);assert.equal(unavailable.unlocked,2);assert.equal(unavailable.data.rewards.length,1);
});
test('orientation reprojection retains valid falling trajectories',()=>{
  const g=new Game();g.start(2);for(let i=0;i<240;i++)g.update(1/60);g.pause();g.resize(600,860);
  for(const n of g.nuts){assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));assert.equal(n.startY,g.throwY);assert.ok(Math.abs((n.startY+n.vy*n.flight+.5*n.gravity*n.flight**2)-g.catchY)<.001);}
});
