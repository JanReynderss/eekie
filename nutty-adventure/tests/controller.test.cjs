/* Controller integration tests in a small DOM/event harness. These exercise
   production code, not a browser rendering or physical-device touch test. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Core=require('../engine.js');
const root=path.resolve(__dirname,'..');
function memory(){const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};}
async function harness({width=1200,storage=memory()}={}){
  const h={now:0,frames:[],timers:[],map:new Map(),storage};
  class Element {
    constructor(tag='div',attrs=''){
      this.tagName=tag;this.attributes={};this.dataset={};this.listeners={};this.children=[];this.style={};this.hidden=false;this.isConnected=true;this._html='';
      for(const a of attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)){this.attributes[a[1]]=a[2]??'';if(a[1].startsWith('data-'))this.dataset[a[1].slice(5)]=a[2]??'';}
      this.id=this.attributes.id;this.disabled='disabled'in this.attributes;this.checked='checked'in this.attributes;
      if(this.id)h.map.set(this.id,this);
      const classes=new Set((this.attributes.class||'').split(/\s+/));
      this.classList={add:(...s)=>s.forEach(x=>classes.add(x)),remove:(...s)=>s.forEach(x=>classes.delete(x)),contains:s=>classes.has(s),toggle:(s,on)=>{const value=on??!classes.has(s);if(value)classes.add(s);else classes.delete(s);return value;}};
    }
    set className(v){this.attributes.class=v;const list=v.split(/\s+/);this.classList={add:()=>{},remove:()=>{},toggle:()=>{},contains:s=>list.includes(s)};}
    set innerHTML(value){
      this._html=value;this.children.forEach(n=>{n.isConnected=false;if(n.id)h.map.delete(n.id);});this.children=[];
      for(const match of value.matchAll(/<(button|input)\b([^>]*)>/g))this.children.push(new Element(match[1],match[2]));
    }
    get innerHTML(){return this._html;}
    matches(selector){
      return selector.split(',').some(raw=>{const s=raw.trim();if(s==='button:not(:disabled)')return this.tagName==='button'&&!this.disabled;
        if(s.startsWith('.'))return this.classList.contains(s.slice(1));
        if(s.startsWith('[')){const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return m&&(m[1]in this.attributes)&&(m[2]===undefined||this.attributes[m[1]]===m[2]);}
        return s===this.tagName;
      });
    }
    closest(s){return this.matches(s)?this:null;}
    querySelectorAll(s){return this.children.filter(n=>n.matches(s));}
    querySelector(s){if(s==='span'&&this.id==='playButton'){if(!this.span)this.span=new Element('span');return this.span;}return this.querySelectorAll(s)[0]||null;}
    setAttribute(k,v){this.attributes[k]=String(v);}
    getAttribute(k){return this.attributes[k];}
    focus(){h.document.activeElement=this;}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    dispatch(type,detail={}){const event={target:this,preventDefault(){},...detail};for(const fn of this.listeners[type]||[])fn(event);}
    getBoundingClientRect(){return{left:0,top:0,width:width<=650?width-26:1100,height:width<=650?(width-26)*860/600:605};}
    setPointerCapture(){}
    getContext(){return h.ctx;}
  }
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="[^"]+"[^>]*)>/g))new Element(m[1],m[2]);
  h.document=new Element('document');h.document.body=new Element('body');h.document.activeElement=h.document.body;h.document.hidden=false;h.document.getElementById=id=>h.map.get(id)||null;
  h.window=new Element('window');h.window.innerWidth=width;h.window.devicePixelRatio=1;h.window.localStorage=storage;h.window.matchMedia=()=>({matches:false,addEventListener(){}});
  const gradient={addColorStop(){}};
  h.ctx=new Proxy({},{get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:()=>{},set:()=>true});
  h.window.setInterval=()=>0;
  class CapturedGame extends Core.Game{constructor(args){super({...args,random:()=>.47});h.game=this;}}
  class LocalImage {
    constructor(){this.width=640;this.height=640;}
    set src(value){assert.ok(fs.existsSync(path.join(root,value)),`Missing asset: ${value}`);queueMicrotask(()=>this.onload?.());}
  }
  const context=vm.createContext({window:h.window,document:h.document,NuttyCore:{...Core,Game:CapturedGame},Image:LocalImage,ResizeObserver:class{observe(){}},console,
    requestAnimationFrame:fn=>h.frames.push(fn),setTimeout:(fn,ms)=>h.timers.push({fn,at:h.now+ms})});
  vm.runInContext(fs.readFileSync(path.join(root,'art.js'),'utf8'),context,{filename:'art.js'});context.NuttyArt=h.window.NuttyArt;
  vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),context,{filename:'game.js'});
  h.el=id=>h.map.get(id);
  h.click=id=>h.el(id).dispatch('click');
  h.action=action=>{const modal=h.el('modal'),button=modal.querySelector(`[data-action="${action}"]`);assert.ok(button,`Action ${action} is present`);assert.ok(!button.disabled);modal.dispatch('click',{target:button});};
  h.tick=(dt=1/60)=>{h.now+=dt*1000;const frames=h.frames.splice(0);frames.forEach(fn=>fn(h.now));for(let i=h.timers.length-1;i>=0;i--){if(h.timers[i].at<=h.now){const timer=h.timers.splice(i,1)[0];timer.fn();}}};
  h.advance=seconds=>{for(let i=0;i<Math.ceil(seconds*60);i++)h.tick();};
  h.autoLevel=()=>{
    const canvas=h.el('gameCanvas'),bounds=canvas.getBoundingClientRect();canvas.dispatch('pointerdown',{pointerId:1,clientX:bounds.width/2});
    let frames=0;
    while(h.game.state==='playing'&&frames++<6000){const next=h.game.nuts.filter(n=>n.y<=h.game.catchY+18).sort((a,b)=>(a.flight-a.age)-(b.flight-b.age))[0];canvas.dispatch('pointermove',{pointerId:1,clientX:(next?next.target:h.game.player.x)/h.game.width*bounds.width});h.tick();}
    canvas.dispatch('pointerup',{pointerId:1});assert.equal(h.game.state,'level-complete');assert.equal(h.game.score,15);
    h.advance(1.2);assert.ok(h.el('modal').innerHTML.includes('Open your level'));
  };
  await new Promise(resolve=>setImmediate(resolve));
  return h;
}
test('production menu → five played levels → five opened boxes → heart finale → replay',async()=>{
  const h=await harness();h.click('playButton');
  for(let level=0;level<5;level++){
    assert.equal(h.game.level,level);h.autoLevel();assert.equal(h.game.state,'mysterybox');
    h.action('open-box');h.advance(1.1);assert.ok(h.el('modal').innerHTML.includes(Core.LEVELS[level].reward));
    const saved=new Core.Progress(h.storage);assert.equal(saved.data.rewards.length,level+1);
    h.advance(2);assert.equal(h.game.state,'mysterybox','the next level waits for the player');
    h.action(level===4?'victory':'next');
  }
  assert.equal(h.game.state,'victory');h.advance(3.3);assert.ok(h.el('modal').innerHTML.includes('YOU DID IT!'));
  h.action('treasures');assert.ok(h.el('modal').innerHTML.includes('5 of 5'));h.action('close');
  assert.ok(h.el('modal').innerHTML.includes('YOU DID IT!'));h.action('play-again');assert.equal(h.game.state,'playing');assert.equal(h.game.level,0);assert.equal(h.game.score,0);
  const reload=await harness({storage:h.storage});reload.click('treasuresButton');assert.ok(reload.el('modal').innerHTML.includes('WATCH THE HEART FINALE'));
  reload.action('victory');assert.equal(reload.game.state,'victory');
});
test('keyboard, pause/resume and mobile pointer handlers operate the real controller',async()=>{
  const h=await harness({width:390});h.click('playButton');h.advance(.1);assert.equal(h.game.width,600);
  h.window.dispatch('keydown',{key:'ArrowLeft',target:h.el('gameCanvas')});h.advance(.2);h.window.dispatch('keyup',{key:'ArrowLeft'});assert.ok(h.game.player.x<300);
  h.window.dispatch('keydown',{key:'p',target:h.el('gameCanvas')});assert.equal(h.game.state,'paused');const x=h.game.player.x;h.advance(.3);assert.equal(h.game.player.x,x);
  h.window.dispatch('keydown',{key:' ',target:h.el('modal')});assert.equal(h.game.state,'playing');
  h.el('gameCanvas').dispatch('pointerdown',{pointerId:9,clientX:340});h.advance(.5);h.el('gameCanvas').dispatch('pointerup',{pointerId:9});assert.ok(h.game.player.x>400);
  h.el('leftTouch').dispatch('pointerdown',{pointerId:2});h.advance(.25);h.el('leftTouch').dispatch('pointercancel',{pointerId:2});assert.ok(h.game.player.x<400);
  const after=h.game.player.x;h.advance(.1);assert.equal(h.game.player.x,after);
});
test('a pending box survives reload and is offered before another level',async()=>{
  const storage=memory(),saved=new Core.Progress(storage);saved.complete(0);
  const h=await harness({storage});h.click('playButton');assert.equal(h.game.state,'mysterybox');assert.equal(h.game.score,15);
  h.action('open-box');h.advance(1);assert.ok(h.el('modal').innerHTML.includes('Golden Acorn'));h.action('next');assert.equal(h.game.level,1);
});
