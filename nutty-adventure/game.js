(function () {
  'use strict';
  const { Game, Progress, LEVELS, GOAL, clamp } = NuttyCore, Art = NuttyArt;
  const $ = id => document.getElementById(id);
  const canvas = $('gameCanvas'), ctx = canvas.getContext('2d'), stage = $('stage');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let storage; try { storage = window.localStorage; } catch { storage = null; }
  const progress = new Progress(storage);
  const rewardFiles = ['golden-acorn','moonlit-mushroom','starlight-diamond','glowflower','friendship-star'];
  // Interface copy lives together so translations can be added without changing physics.
  const TEXT = { en: { play: 'PLAY GAME', continue: 'CONTINUE GAME', next: 'NEXT LEVEL →', retry: 'TRY AGAIN', resume: 'KEEP CATCHING', caught: 'NICE CATCH!', super: 'SUPER SQUIRREL!', saveUnavailable: 'Progress is available for this visit only' } };
  const t = TEXT.en;
  let reduced = progress.data.reduced ?? media.matches;
  document.body.classList.toggle('reduced-motion', reduced);

  class ForestSound {
    constructor() { this.enabled = progress.data.sound; this.ctx = null; this.master = null; this.beat = 0; this.timer = null; }
    wake() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
          this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? .32 : 0; this.master.connect(this.ctx.destination);
          this.timer = window.setInterval(() => this.music(), 420);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      } catch { /* Audio is optional; gameplay never depends on the audio device. */ }
    }
    toggle() { this.enabled = !this.enabled; progress.data.sound = this.enabled; progress.save(); if(this.ctx) this.master.gain.setTargetAtTime(this.enabled ? .32 : 0, this.ctx.currentTime, .05); this.wake(); updateSoundButton(); }
    tone(freq, duration = .2, delay = 0, wave = 'sine', volume = .16) {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      try {
        const now = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = wave; osc.frequency.setValueAtTime(freq, now); gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + .015); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
        osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .02);
      } catch { /* A suspended/closed audio context is harmless. */ }
    }
    music() {
      if (document.hidden || game.state === 'paused' || game.state === 'game-over' || !this.enabled) return;
      const notes = game.state === 'victory' ? [523,659,784,1047,880,784,659,784,523,659,784,1175,1047,784,659,523] : [262,330,392,494,440,392,330,294,262,330,392,523,494,392,330,294];
      this.tone(notes[this.beat++ % notes.length], .9, 0, 'sine', .055);
      if (this.beat % 4 === 0) this.tone(131, 1.5, 0, 'triangle', .04);
    }
    play(kind) {
      if (kind === 'catch') { this.tone(880,.13); this.tone(1320,.22,.06); }
      else if (kind === 'miss') { this.tone(190,.14,0,'triangle'); this.tone(130,.22,.08,'triangle'); }
      else if (kind === 'complete') [523,659,784,1047].forEach((n,i)=>this.tone(n,.55,i*.11,'triangle',.2));
      else if (kind === 'magic') [523,784,1047,1318,1568,2093].forEach((n,i)=>this.tone(n,.7,i*.1,'sine',.15));
      else if (kind === 'victory') [523,659,784,1047,988,880,784,1047].forEach((n,i)=>this.tone(n,1,i*.2,'triangle',.18));
    }
  }
  const sound = new ForestSound();
  let sceneTime = 0, lastTime = 0, catchAge = 10, missAge = 10, toastTimer = 0, victoryTime = 0;
  let modalKind = '', modalResume = false, focusBefore = null, roundId = 0, pointer = null;
  let targetX = null, touchAxis = 0, lastHud = '', introUntil = 0;
  const keys = new Set(), particles = [];
  const game = new Game({ emit: onGameEvent });

  function burst(x,y,count=17,kind='star',color='#ffe4a0') {
    if (reduced) count = Math.min(count,4);
    for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=45+Math.random()*150,life=.5+Math.random()*.65;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-35,life,max:life,age:0,kind,color,size:kind==='heart'?8+Math.random()*14:2+Math.random()*5});}
  }
  function announce(text) { $('liveStatus').textContent = text; }
  function toast(text) { $('gameToast').textContent = text; $('gameToast').classList.add('show'); toastTimer = 1.55; }
  function onGameEvent(type, data = {}) {
    if(type==='start') { catchAge=10;missAge=10;particles.length=0;lastHud='';updateHud(); }
    if(type==='catch') {
      catchAge=0;burst(data.x,data.y,14);sound.play('catch');
      if(data.streak===3)toast(t.caught);if(data.streak===8)toast(t.super);
      if(data.streak%5===0) game.rabbit.throwFlash=.65;
      announce(`${data.score} of 15 nuts. ${15-data.score} to your mystery box.`);updateHud();
    }
    if(type==='miss') { missAge=0;burst(data.x,data.y,11,'dust','#dfc691');sound.play('miss');announce(`${data.lives} lives remaining.`);updateHud(); }
    if(type==='complete') {
      progress.complete(data.level);updateJourney();sound.play('complete');toast('15 NUTS. A LITTLE MAGIC!');
      burst(game.player.x,game.catchY-80,35);const token=roundId;
      setTimeout(()=>{if(roundId===token && game.state==='level-complete')showMystery(data.level);},reduced?250:1050);
    }
    if(type==='gameover') { clearInput(); showGameOver(); }
  }
  function clearInput() { keys.clear();touchAxis=0;targetX=null;pointer=null;game.player.vx=0; }
  function updateSoundButton() {
    $('soundButton').classList.toggle('is-muted',!sound.enabled);$('soundButton').setAttribute('aria-label',sound.enabled?'Turn sound off':'Turn sound on');$('soundButton').title=`Sound ${sound.enabled?'on':'off'}`;
    const check=$('soundSetting');if(check)check.checked=sound.enabled;
  }
  function updateHud() {
    const signature=`${game.level}/${game.score}/${game.lives}`;if(lastHud===signature)return;lastHud=signature;
    const cfg=LEVELS[game.level];$('levelNumber').textContent=`LEVEL 0${game.level+1} / 05`;$('levelName').textContent=cfg.name;$('hudNut').src=`./assets/nuts/${cfg.nut}.svg`;
    $('scoreText').innerHTML=`${game.score} <em>/ ${GOAL} nuts</em>`;$('remainingText').textContent=game.score===15?'Your mystery box is ready!':`${GOAL-game.score} to your mystery box`;
    $('progressFill').style.width=`${game.score/GOAL*100}%`;
    $('lives').innerHTML=Array.from({length:5},(_,i)=>`<span class="life ${i>=game.lives?'lost':''}" aria-hidden="true">♥</span>`).join('');$('lives').setAttribute('aria-label',`${game.lives} lives remaining`);
  }
  function updateJourney() {
    $('treasureBadge').textContent=progress.data.rewards.length;
    $('playButton').querySelector('span').textContent=progress.data.completed>0&&progress.data.completed<5||progress.data.pending!==null?t.continue:t.play;
    $('levelTrail').innerHTML=LEVELS.map((cfg,i)=>`<button class="trail-stop ${i<progress.data.completed?'is-complete':i===Math.min(progress.data.completed,4)?'is-current':''}" data-level="${i}" ${i>=progress.unlocked?'disabled':''} aria-label="${cfg.name}, ${i>=progress.unlocked?'locked':i<progress.data.completed?'completed':'unlocked'}"><span class="stop-icon"><img src="./assets/nuts/${cfg.nut}.svg" alt="">${i<progress.data.completed?'<span class="stop-check">✓</span>':''}</span><span class="stop-copy"><small>LEVEL 0${i+1}</small>${cfg.name}</span></button>`).join('');
    if(!progress.available)$('saveStatus').textContent=t.saveUnavailable;
  }
  function setStage(mode) {
    stage.classList.toggle('is-menu',mode==='menu');stage.classList.toggle('is-victory',mode==='victory');
    $('menuScreen').hidden=mode!=='menu';$('stageBottom').hidden=mode!=='menu';$('hud').hidden=mode==='menu'||mode==='victory';$('touchControls').hidden=mode!=='playing';
    if(mode!=='playing')$('levelIntro').hidden=true;
  }
  function hideModal() {
    $('modalOverlay').hidden=true;$('modalOverlay').classList.remove('victory-overlay');modalKind='';modalResume=false;
    if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true});
  }
  function showModal(html,{kind='info',wide=false,close=true,resume=true}={}) {
    const alreadyOpen=!$('modalOverlay').hidden;
    if(!alreadyOpen){focusBefore=document.activeElement;modalResume=game.state==='playing'&&resume;}
    if(game.state==='playing')game.pause();clearInput();
    modalKind=kind;$('modal').className=`modal${wide?' wide':''}${kind==='victory'?' victory-card':''}`;
    $('modal').innerHTML=(close?'<button class="modal-close" data-action="close" aria-label="Close dialog">×</button>':'')+html;
    $('modalOverlay').hidden=false;$('modalOverlay').classList.toggle('victory-overlay',kind==='victory');
    requestAnimationFrame(()=>{const focus=$('modal').querySelector('[autofocus], .primary-button, button, input');(focus||$('modal')).focus({preventScroll:true});});
  }
  function closeModal() {
    const shouldResume=modalResume;hideModal();
    if(shouldResume&&game.state==='paused'){game.resume();setStage('playing');canvas.focus({preventScroll:true});}
    else if(game.state==='victory')showVictoryModal();
  }
  function startLevel(level=0) {
    if(level>=progress.unlocked)return;
    roundId++;hideModal();clearInput();victoryTime=0;setStage('playing');game.start(level);sound.wake();
    $('introNumber').textContent=`CHAPTER 0${level+1}`;$('introName').textContent=LEVELS[level].name;$('introSubtitle').textContent=LEVELS[level].subtitle;$('levelIntro').hidden=false;introUntil=sceneTime+1.7;
    announce(`Level ${level+1}: ${LEVELS[level].name}. Catch 15 ${LEVELS[level].nut}s. You have five lives.`);canvas.focus({preventScroll:true});
  }
  function play() {
    sound.wake();
    if(progress.data.pending!==null){roundId++;hideModal();game.level=progress.data.pending;game.score=15;game.lives=5;updateHud();setStage('playing');showMystery(game.level);}
    else startLevel(progress.data.completed<5?progress.data.completed:0);
  }
  function goHome() { roundId++;hideModal();clearInput();game.state='menu';game.nuts=[];particles.length=0;victoryTime=0;$('gameToast').classList.remove('show');toastTimer=0;setStage('menu');updateJourney();$('playButton').focus({preventScroll:true}); }
  function pause() {
    if(game.state!=='playing')return;game.pause();clearInput();
    showModal(`<div class="eyebrow">A LITTLE BREATHER</div><h2 id="modalTitle">The forest can wait.</h2><p>Your nuts, hearts and little adventure<br>will be right here when you’re ready.</p><div class="modal-actions"><button class="primary-button" data-action="resume">${t.resume} →</button><button class="secondary-button" data-action="home">BACK TO MENU</button></div>`,{kind:'pause'});modalResume=true;announce('Game paused.');
  }
  function showHow() {
    showModal(`<div class="eyebrow">LITTLE PAWS, SIMPLE RULES</div><h2 id="modalTitle">A basketful of magic.</h2><div class="how-grid"><div><span class="how-icon"><svg viewBox="0 0 24 24"><path d="M2 12h20m-15-5-5 5 5 5m10-10 5 5-5 5"/></svg></span><strong>01. Find your feet</strong><p>Move with ← → or A / D. On a touchscreen, drag anywhere in the forest or hold the arrow buttons.</p></div><div><span class="how-icon"><img src="./assets/nuts/almond.svg" alt=""></span><strong>02. Catch a little joy</strong><p>Line up your basket with the falling nuts. Catch 15 to finish a level. Each missed nut costs one of your 5 hearts.</p></div><div><span class="how-icon"><img src="./assets/rewards/mystery-box.svg" alt=""></span><strong>03. Unwrap the wonder</strong><p>Open a mystery box after every level. Collect five unique treasures and discover a very big surprise!</p></div></div><p>Press <b>P</b> to pause. Press <b>Space</b> to start or resume.<br>Lost your hearts? Retry with five fresh ones.</p><div class="modal-actions"><button class="primary-button" data-action="close">GOT IT! →</button></div>`,{kind:'how',wide:true});
  }
  function showLevels() {
    showModal(`<div class="eyebrow">FIVE STOPS. A WORLD OF WONDER.</div><h2 id="modalTitle">Your forest journey.</h2><p>Catch 15 nuts to unlock the next little adventure.</p><div class="level-select">${LEVELS.map((cfg,i)=>`<button class="level-option" data-action="level" data-level="${i}" ${i>=progress.unlocked?'disabled':''}><img src="./assets/nuts/${cfg.nut}.svg" alt=""><span><strong>${i+1}. ${cfg.name}</strong><small>${['Gentle drops · A cozy beginning','Roaming throws · Follow your friend','Diagonal & zigzag · A cheeky twist','Quick doubles · Find your rhythm','Surprise fans · The grand challenge'][i]}</small></span><span>${i<progress.data.completed?'✓':i>=progress.unlocked?'⌑':'→'}</span></button>`).join('')}</div>`,{kind:'levels'});
  }
  function showTreasures() {
    showModal(`<div class="eyebrow">LITTLE THINGS, LOVINGLY COLLECTED</div><h2 id="modalTitle">Your tiny treasures.</h2><p>${progress.data.rewards.length} of 5 pieces of forest magic, all yours.</p><div class="treasure-grid">${LEVELS.map((cfg,i)=>{const owned=progress.data.rewards.includes(i);return `<div class="treasure-item ${owned?'':'locked'}"><img src="./assets/rewards/${rewardFiles[i]}.svg" alt="${owned?cfg.reward:'A treasure waiting to be discovered'}"><span>${owned?cfg.reward:`Level ${i+1}<br>Still a mystery`}</span></div>`;}).join('')}</div><p>Every mystery box holds something different.<br>The loveliest treasure is the journey together.</p>${progress.data.victory?'<button class="primary-button" data-action="victory">WATCH THE HEART FINALE ♡</button>':''}<div class="modal-actions"><button class="secondary-button" data-action="close">BACK TO THE FOREST</button></div>`,{kind:'treasures',wide:true});
  }
  function showSettings() {
    showModal(`<div class="eyebrow">MAKE YOURSELF AT HOME</div><h2 id="modalTitle">A comfortable adventure.</h2><label class="settings-row"><span><strong>Forest sounds</strong><small>Soft music and little moments of magic.</small></span><input id="soundSetting" type="checkbox" ${sound.enabled?'checked':''}></label><label class="settings-row"><span><strong>Reduced motion</strong><small>Fewer particles, no bobbing or spinning.<br>Falling nuts keep moving so you can play.</small></span><input id="motionSetting" type="checkbox" ${reduced?'checked':''}></label><p>${progress.available?'Your treasures and unlocked levels are saved on this browser.':'Browser storage is unavailable. You can still play every level during this visit.'}</p><button class="primary-button" data-action="close">ALL SET →</button>`,{kind:'settings'});
  }
  function showGameOver() {
    setStage('paused');showModal(`<img class="modal-illustration" src="./assets/nuts/${LEVELS[game.level].nut}.svg" alt=""><div class="eyebrow">EVEN LITTLE PAWS NEED PRACTICE</div><h2 id="modalTitle">Another little try?</h2><p>You caught <b>${game.score} of 15 nuts</b> in ${LEVELS[game.level].name}.<br>Your unlocked levels and treasures are safe.<br>Let’s try again with five fresh hearts.</p><div class="modal-actions"><button class="primary-button" data-action="retry">${t.retry} →</button><button class="secondary-button" data-action="home">BACK TO MENU</button></div>`,{kind:'gameover',close:false});announce('Out of hearts. You can retry this level.');
  }
  function showMystery(level) {
    game.state='mysterybox';game.level=level;game.score=15;game.nuts=[];game.pending=null;game.extraThrows=[];updateHud();setStage('paused');
    showModal(`<div class="eyebrow">15 NUTS. 1 LOVELY SURPRISE.</div><h2 id="modalTitle">A little wonder awaits.</h2><p>${LEVELS[level].name}, beautifully caught!</p><button class="gift-button box-level-${level}" data-action="open-box" aria-label="Open your level ${level+1} mystery box"><img src="./assets/rewards/mystery-box.svg" alt="A golden mystery box with a big ribbon"></button><p class="gift-instruction">TAP THE BOX TO UNWRAP THE MAGIC</p>`,{kind:'box',close:false,resume:false});announce('Level complete. Open your mystery box.');
  }
  function openBox() {
    if(modalKind!=='box')return;modalKind='opening';const button=$('modal').querySelector('.gift-button');button.disabled=true;button.classList.add('opening');sound.play('magic');
    const level=game.level,token=roundId;
    burst(game.width/2,game.height*.45,40,'star','#ffda6a');
    setTimeout(()=>{
      if(roundId!==token)return;
      progress.reward(level);updateJourney();
      showModal(`<div class="eyebrow">A PIECE OF FOREST MAGIC</div><h2 id="modalTitle">${LEVELS[level].reward}!</h2><div class="reward-rays"><img class="reward-reveal" src="./assets/rewards/${rewardFiles[level]}.svg" alt="${LEVELS[level].reward}">${[0,1,2,3].map((n)=>`<span class="sparkle-glyph" style="left:${20+n*18}%;top:${n%2?15:65}%">✧</span>`).join('')}</div><p>${['A tiny acorn with a great big golden glow.','A little moonlight, kept just for you.','A sparkle from the brightest star in the forest.','A flower that shines a little brighter with kindness.','A golden reminder that adventures are better together.'][level]}<br>Added to your treasure collection.</p><div class="modal-actions"><button class="primary-button" data-action="${level===4?'victory':'next'}">${level===4?'ONE LAST SURPRISE ♡':t.next}</button><button class="text-button" data-action="home">BACK TO THE FOREST</button></div>`,{kind:'reward',close:false,resume:false});
      announce(`You found the ${LEVELS[level].reward}. ${level===4?'Your heart finale is ready.':'Choose next level when you are ready.'}`);
    },reduced?100:850);
  }
  function startVictory() {
    if(!progress.data.victory)return;
    roundId++;hideModal();clearInput();game.state='victory';game.nuts=[];victoryTime=0;particles.length=0;setStage('victory');sound.wake();sound.play('victory');
    const token=roundId;setTimeout(()=>{if(roundId===token&&game.state==='victory')showVictoryModal();},reduced?350:3100);
    announce('You did it! Five levels. Five mystery boxes. One giant heart! The biggest treasure is friendship.');
  }
  function showVictoryModal() {
    showModal(`<div class="eyebrow">YOU CAUGHT A LITTLE FOREST MAGIC</div><h2 id="modalTitle">YOU DID IT! <span class="mini-heart">♥</span></h2><p>Five levels. Five mystery boxes. One giant heart!</p><div class="friendship">The biggest treasure is friendship.</div><div class="modal-actions"><button class="primary-button" data-action="play-again">PLAY AGAIN</button><button class="secondary-button" data-action="treasures">MY TREASURES</button></div>`,{kind:'victory',close:false,resume:false});
  }
  function handleAction(action,button) {
    sound.wake();
    if(action==='close')closeModal();else if(action==='resume'){hideModal();game.resume();setStage('playing');canvas.focus({preventScroll:true});}
    else if(action==='home')goHome();else if(action==='retry')startLevel(game.level);else if(action==='next')startLevel(game.level+1);
    else if(action==='level'){if(progress.data.pending!==null)showMystery(progress.data.pending);else startLevel(Number(button.dataset.level));}
    else if(action==='open-box')openBox();else if(action==='victory')startVictory();else if(action==='play-again')startLevel(0);
    else if(action==='treasures')showTreasures();
  }
  $('modal').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button&&!button.disabled)handleAction(button.dataset.action,button);});
  $('modal').addEventListener('change',event=>{if(event.target.id==='soundSetting'){if(sound.enabled!==event.target.checked)sound.toggle();}if(event.target.id==='motionSetting'){reduced=event.target.checked;document.body.classList.toggle('reduced-motion',reduced);progress.data.reduced=reduced;progress.save();}});
  $('playButton').addEventListener('click',play);$('homeButton').addEventListener('click',()=>{if(game.state==='playing')pause();else goHome();});
  $('howButton').addEventListener('click',showHow);$('levelsButton').addEventListener('click',showLevels);$('treasuresButton').addEventListener('click',showTreasures);$('soundButton').addEventListener('click',()=>sound.toggle());$('accessibilityButton').addEventListener('click',showSettings);$('pauseButton').addEventListener('click',pause);$('levelInfo').addEventListener('click',showLevels);
  $('levelTrail').addEventListener('click',event=>{const b=event.target.closest('[data-level]');if(!b||b.disabled)return;sound.wake();if(progress.data.pending!==null)showMystery(progress.data.pending);else if(game.state==='playing'||game.state==='paused')showLevels();else startLevel(Number(b.dataset.level));});
  window.addEventListener('keydown',event=>{
    const k=event.key.toLowerCase();
    if(!$('modalOverlay').hidden){
      if(k==='tab'){const focusable=[...$('modal').querySelectorAll('button:not(:disabled),input')];if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
      if(k==='escape'&&$('modal').querySelector('[data-action="close"]')){event.preventDefault();closeModal();}
      else if((k==='p'||k===' ')&&modalKind==='pause'&&!event.repeat){event.preventDefault();handleAction('resume');}
      return;
    }
    if(event.target.closest('input,button'))return;
    if(['arrowleft','arrowright','a','d',' ','p'].includes(k)){
      if(game.state==='playing'||k===' '){event.preventDefault();sound.wake();}
      if(k==='p'&&!event.repeat)pause();
      else if(k===' '&&!event.repeat&&game.state==='menu')play();
      else if(game.state==='playing')keys.add(k);
    }
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  const pauseOnLeave=()=>{clearInput();if(game.state==='playing')pause();};
  window.addEventListener('blur',pauseOnLeave);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseOnLeave();});
  function pointerX(event){const rect=canvas.getBoundingClientRect();return (event.clientX-rect.left)/rect.width*game.width;}
  canvas.addEventListener('pointerdown',event=>{if(game.state!=='playing')return;event.preventDefault();sound.wake();pointer=event.pointerId;targetX=pointerX(event);canvas.setPointerCapture(pointer);canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointermove',event=>{if(event.pointerId===pointer&&game.state==='playing'){event.preventDefault();targetX=pointerX(event);}});
  for(const eventType of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(eventType,event=>{if(event.pointerId===pointer){pointer=null;targetX=null;}});
  for(const [id,axis] of [['leftTouch',-1],['rightTouch',1]]){
    const button=$(id);button.addEventListener('pointerdown',event=>{if(game.state!=='playing')return;event.preventDefault();touchAxis=axis;targetX=null;button.setPointerCapture(event.pointerId);sound.wake();});
    for(const eventType of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventType,()=>{if(touchAxis===axis)touchAxis=0;});
  }
  media.addEventListener('change',event=>{if(progress.data.reduced===null){reduced=event.matches;document.body.classList.toggle('reduced-motion',reduced);}});

  function resize() {
    const mobile=window.innerWidth<=650,w=mobile?600:1200,h=mobile?860:660;
    if(game.width!==w){if(game.state==='playing')pause();game.resize(w,h);}
    const dpr=Math.min(window.devicePixelRatio||1,2),rect=stage.getBoundingClientRect();
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
  }
  new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize',resize);
  function drawScene() {
    const w=game.width,h=game.height,mobile=w<800,state=game.state;
    ctx.clearRect(0,0,w,h);const clock=reduced?0:sceneTime;
    Art.background(ctx,w,h,sceneTime,state==='menu'?0:game.level,reduced);
    if(state==='menu'){
      const rx=w*(mobile?.72:.76),ty=h*(mobile?.59:.35);
      Art.platform(ctx,w,ty+89,true);
      // Little drill parked well away from the actual catching lane.
      ctx.save();ctx.globalAlpha=mobile?.55:.8;Art.truck(ctx,w*(mobile?.11:.18),h*.87,0,mobile?.42:.56,true);ctx.restore();
      for(let i=0;i<12;i++)Art.nut(ctx,['acorn','almond','walnut'][i%3],rx-30+(i%5)*21,ty+6-Math.floor(i/5)*13,15,i*.5);
      Art.rabbit(ctx,rx,ty,clock,{scale:mobile?1.03:1.08,reduced,arms:false});Art.truck(ctx,rx-50,ty+31,clock,mobile?.88:1);Art.rabbitArms(ctx,rx,ty,clock,{scale:mobile?1.03:1.08,reduced});
      Art.squirrel(ctx,w*(mobile?.41:.655),h*(mobile?.89:.925),clock,{scale:mobile?1.3:1.46,reduced});
    }else if(state==='victory'){
      const fade=clamp(victoryTime/2,0,1);ctx.fillStyle=`rgba(255,204,99,${fade*.26})`;ctx.fillRect(0,0,w,h);
      const ty=game.platformY;Art.platform(ctx,w,ty+96);
      Art.truck(ctx,w*.73,ty+31,0,.9);
      const jump=clamp(victoryTime/2,0,1),rabbitY=ty+(h-98-ty)*jump-(reduced?0:Math.sin(jump*Math.PI)*95);
      Art.rabbit(ctx,w*(.73-.08*jump),rabbitY,clock,{celebrate:true,ground:jump>.9,scale:mobile?1.08:1,reduced});
      Art.squirrel(ctx,w*.34,h-39,clock,{celebrate:true,scale:mobile?1.12:1.12,reduced,victory:victoryTime>1.2});
      if(victoryTime>1.2)Art.basket(ctx,w*.21,h-79,mobile?83:91);
      if(victoryTime>.7){const growth=clamp((victoryTime-.7)/2,0,1),pulse=reduced?1:1+Math.sin(victoryTime*3)*.04;Art.heart(ctx,w*.5,h*(mobile?.57:.57),growth*pulse*(mobile?170:155));}
    }else{
      Art.platform(ctx,w,game.platformY+96);
      // A small parked drill remains visible as an environmental story detail.
      ctx.save();ctx.globalAlpha=.55;Art.truck(ctx,w-38,h-62,0,mobile?.26:.34,true);ctx.restore();
      const rx=game.rabbit.x,ty=game.throwY;
      for(let i=0;i<12;i++)Art.nut(ctx,LEVELS[game.level].nut,rx-26+(i%5)*20,game.platformY+7-Math.floor(i/5)*13,14,i*.7);
      const rabbitAnimation={windup:game.rabbit.windup,flash:game.rabbit.throwFlash,celebrate:state==='level-complete'||state==='mysterybox'||game.rabbit.throwFlash>.4,reduced};
      Art.rabbit(ctx,rx,ty,clock,{...rabbitAnimation,arms:false});
      Art.truck(ctx,rx-50,game.platformY+31,clock,.91);Art.rabbitArms(ctx,rx,ty,clock,rabbitAnimation);
      // Shadows move along the ground; the nuts remain crisp in the foreground.
      for(const n of game.nuts){ctx.save();ctx.globalAlpha=.13+clamp(n.y/h,0,1)*.15;ctx.fillStyle='#1a3829';ctx.beginPath();ctx.ellipse(n.x,h-35,10+(h-n.y)*.02,3+(h-n.y)*.004,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      Art.squirrel(ctx,game.player.x,h-(mobile?46:36),clock,{vx:game.player.vx,catchAge,missAge,celebrate:state==='level-complete'||state==='mysterybox',scale:mobile?220/190:1,reduced});
      for(const n of game.nuts){ctx.save();ctx.shadowColor='#162f2566';ctx.shadowBlur=6;ctx.shadowOffsetY=4;Art.nut(ctx,n.type,n.x,n.y,mobile?23:20,n.angle);ctx.restore();}
    }
    for(const p of particles)Art.particle(ctx,p);
  }
  function frame(now) {
    const dt=lastTime?Math.min((now-lastTime)/1000,.05):0;lastTime=now;sceneTime+=dt;catchAge+=dt;missAge+=dt;
    if(game.state==='playing')game.update(dt,{axis:touchAxis||(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0),targetX:targetX===null?undefined:targetX});
    if(game.state==='victory'){
      const previous= Math.floor(victoryTime/.16);victoryTime+=dt;
      if(!reduced&&victoryTime>1&&Math.floor(victoryTime/.16)>previous)burst(game.width*.5+(Math.random()-.5)*game.width*.6,game.height*.72,1,'heart','#ffd895');
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='heart'?-25:90)*dt;if(p.life<=0)particles.splice(i,1);}
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('gameToast').classList.remove('show');}
    if(!$('levelIntro').hidden&&sceneTime>introUntil)$('levelIntro').hidden=true;
    drawScene();requestAnimationFrame(frame);
  }
  updateJourney();updateSoundButton();setStage('menu');resize();
  Art.ready.then(results=>{if(results.some(v=>!v))console.warn('An optional visual did not load; fallback art remains available.');});
  requestAnimationFrame(frame);
})();
