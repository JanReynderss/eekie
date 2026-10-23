/* Layered 2.5D renderer. Plush renders are composited with animated tails,
   rabbit arms, vehicles, physics objects, shadows and particles. */
(function () {
  'use strict';
  const images = {};
  const files = { forest: 'backgrounds/enchanted-forest.webp', squirrel: 'characters/squirrel.webp', tail: 'characters/tail.webp', rabbit: 'characters/rabbit.webp', arm: 'characters/rabbit-arm.webp', celebration: 'characters/squirrel-victory.webp', truck: 'characters/truck.webp' };
  for (const type of ['almond','acorn','chestnut','hazelnut','walnut']) files[type] = `nuts/${type}.svg`;
  const ready = Promise.all(Object.entries(files).map(([key, path]) => new Promise(resolve => {
    const img = new Image(); img.onload = () => { images[key] = img; resolve(true); }; img.onerror = () => resolve(false); img.src = `./assets/${path}`;
  })));
  const clamp = NuttyCore.clamp;
  function ellipse(c,x,y,rx,ry,color) { c.fillStyle=color; c.beginPath(); c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2); c.fill(); }
  function round(c,x,y,w,h,r,fill,stroke) { c.beginPath(); c.roundRect(x,y,w,h,r); if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();} }
  function sprite(c,key,x,bottom,h) { const img=images[key]; if(!img)return; const w=h*img.width/img.height; c.drawImage(img,x-w/2,bottom-h,w,h); }
  function cover(c,img,w,h){const s=Math.max(w/img.width,h/img.height);c.drawImage(img,(w-img.width*s)/2,(h-img.height*s)/2,img.width*s,img.height*s);}
  function nut(c,type,x,y,r=18,rotation=0) {
    c.save();c.translate(x,y);c.rotate(rotation);
    const image=images[type];if(image)c.drawImage(image,-r,-r,r*2,r*2);else ellipse(c,0,0,r*.7,r,'#bc7c36');c.restore();
  }
  function star(c,x,y,r,color,rotation=0){c.save();c.translate(x,y);c.rotate(rotation);c.fillStyle=color;c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.4:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();c.restore();}
  function heart(c,x,y,size,opacity=1){c.save();c.globalAlpha=opacity;c.translate(x,y);c.scale(size/100,size/100);const g=c.createLinearGradient(-20,-60,20,55);g.addColorStop(0,'#ffb9c0');g.addColorStop(.45,'#ef6e90');g.addColorStop(1,'#c83f71');c.shadowColor='#ffc4bb';c.shadowBlur=32;c.fillStyle=g;c.beginPath();c.moveTo(0,42);c.bezierCurveTo(-17,26,-72,-12,-44,-43);c.bezierCurveTo(-24,-64,-2,-46,0,-34);c.bezierCurveTo(20,-68,62,-51,57,-18);c.bezierCurveTo(55,9,21,32,0,42);c.fill();c.shadowBlur=0;c.strokeStyle='#ffe7df88';c.lineWidth=5;c.beginPath();c.moveTo(-37,-28);c.quadraticCurveTo(-29,-44,-15,-38);c.stroke();c.restore();}
  function basket(c,x,y,w=105) {
    c.save();c.translate(x,y);const g=c.createLinearGradient(0,0,0,61);g.addColorStop(0,'#cd9343');g.addColorStop(.6,'#b27531');g.addColorStop(1,'#8a5424');
    c.fillStyle=g;c.beginPath();c.moveTo(-w/2,0);c.lineTo(-w*.38,46);c.quadraticCurveTo(0,62,w*.38,46);c.lineTo(w/2,0);c.fill();
    c.save();c.clip();c.strokeStyle='#e8b96377';c.lineWidth=3;for(let row=6;row<55;row+=7){c.beginPath();c.moveTo(-w/2,row);c.quadraticCurveTo(0,row+9,w/2,row);c.stroke();}for(let col=-w/2;col<w/2;col+=10){c.beginPath();c.moveTo(col,0);c.lineTo(col*.8,55);c.stroke();}c.restore();ellipse(c,0,0,w/2,11,'#694121');c.strokeStyle='#e4b46c';c.lineWidth=5;c.beginPath();c.ellipse(0,0,w/2,11,0,0,Math.PI*2);c.stroke();c.restore();
  }
  function truck(c,x,y,time,scale=1,drill=false){
    c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,0,64,130,12,'#11332455');
    if(images.truck&&!drill){const img=images.truck,w=277,h=w*img.height/img.width;c.drawImage(img,-w/2,75-h,w,h);c.restore();return;}
    const yellow=c.createLinearGradient(0,-60,0,50);yellow.addColorStop(0,'#ffe587');yellow.addColorStop(.35,'#f8cb4e');yellow.addColorStop(1,'#cf8e25');
    for(const wx of [-77,77]){ellipse(c,wx,40,31,34,'#27372b');ellipse(c,wx,40,24,27,'#344b37');ellipse(c,wx,40,16,18,'#d7a646');ellipse(c,wx,40,7,8,'#766236');c.strokeStyle='#506041';c.lineWidth=5;for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.4;c.beginPath();c.moveTo(wx+Math.cos(a)*26,40+Math.sin(a)*28);c.lineTo(wx+Math.cos(a)*31,40+Math.sin(a)*33);c.stroke();}}
    round(c,-114,-33,67,67,14,yellow,'#8b762e');round(c,-107,-65,58,46,11,yellow,'#9e8837');round(c,-98,-57,38,28,7,'#407976','#e8ce65');
    c.strokeStyle='#a4c5a6aa';c.lineWidth=3;c.beginPath();c.moveTo(-94,-53);c.lineTo(-65,-35);c.stroke();
    round(c,-120,19,240,18,7,'#c49233');round(c,-44,-24,164,51,8,yellow,'#aa7929');
    c.strokeStyle='#ffe78b';c.lineWidth=3;for(let i=-27;i<108;i+=28){c.beginPath();c.moveTo(i,-14);c.lineTo(i,17);c.stroke();}
    round(c,-117,-75,79,13,5,'#ffd873');round(c,-122,11,17,13,4,'#fff0a2');round(c,111,10,13,10,3,'#c66c35');
    if(drill){c.save();c.translate(99,-45);c.rotate(-.25);round(c,-8,-5,92,17,6,yellow);c.fillStyle='#535e4c';c.beginPath();c.moveTo(70,-1);c.lineTo(97,17);c.lineTo(90,72);c.lineTo(76,90);c.lineTo(71,70);c.closePath();c.fill();c.strokeStyle='#bdc5a2';c.lineWidth=4;for(let i=28;i<76;i+=10){c.beginPath();c.moveTo(75,i);c.lineTo(94,i+7);c.stroke();}c.restore();}
    c.restore();
  }
  function rabbit(c,x,throwY,time,{windup=0,flash=0,celebrate=false,scale=1,ground=false,reduced=false,arms=true}={}){
    c.save();c.translate(x,throwY);c.scale(scale,scale);
    const bounce = reduced?0:celebrate?Math.abs(Math.sin(time*6))*13:Math.sin(time*2)*2;
    const h=ground?208:176,bottom=ground?62:52;
    c.save();c.translate(0,-bounce);
    if(images.rabbit){
      const img=images.rabbit,w=h*img.width/img.height;
      // The ear strip gently rotates independently; the overlapping face keeps
      // the join hidden. Throw windup gives the ears a readable anticipatory flick.
      const strip=.29,wiggle=reduced?0:Math.sin(time*4)*.025+Math.sin(windup*Math.PI*2)*.055;
      c.save();c.translate(0,bottom-h+h*strip);c.rotate(wiggle);c.drawImage(img,0,0,img.width,img.height*strip,-w/2,-h*strip,w,h*strip+3);c.restore();
      c.drawImage(img,0,img.height*strip,img.width,img.height*(1-strip),-w/2,bottom-h+h*strip,w,h*(1-strip));
    }else{ellipse(c,0,-20,43,55,'#c6c7be');ellipse(c,-17,-92,13,42,'#dddcd2');ellipse(c,17,-92,13,42,'#dddcd2');ellipse(c,0,-44,38,34,'#dddcd2');ellipse(c,-13,-49,7,10,'#30362d');ellipse(c,13,-49,7,10,'#30362d');}
    c.restore();c.restore();
    if(arms)rabbitArms(c,x,throwY,time,{windup,flash,celebrate,scale,ground,reduced});
  }
  function rabbitArms(c,x,throwY,time,{windup=0,flash=0,celebrate=false,scale=1,ground=false,reduced=false}={}){
    const bounce=reduced?0:celebrate?Math.abs(Math.sin(time*6))*13:Math.sin(time*2)*2;
    c.save();c.translate(x,throwY);c.scale(scale,scale);c.translate(0,-bounce);
    for(const side of [-1,1]){
      c.save();c.translate(side*20,ground?7:-5);
      let angle=side===1? -Math.sin(windup*Math.PI)*1.7-(flash>0?.35:0):.25;
      if(celebrate)angle=-1.5+(reduced?0:Math.sin(time*7)*.25);
      c.scale(side,1);c.rotate(angle);
      if(images.arm)c.drawImage(images.arm,-5,-16,61,39);else{ellipse(c,25,0,30,12,'#c4c2bd');ellipse(c,48,2,13,12,'#f6ead9');}c.restore();
    }
    c.restore();
  }
  function squirrel(c,x,bottom,time,{vx=0,catchAge=10,missAge=10,celebrate=false,scale=1,reduced=false,victory=false}={}){
    c.save();c.translate(x,bottom);c.scale(scale,scale);const walking=Math.abs(vx)>8;
    const bob=reduced?0:catchAge<.45?-Math.sin(catchAge/.45*Math.PI)*15:celebrate?-Math.abs(Math.sin(time*5))*14:walking?-Math.abs(Math.sin(time*17))*4:Math.sin(time*2)*1.4;
    ellipse(c,12,2,74,11,'#13382455');
    c.save();c.translate(26,-12+bob);c.rotate(reduced?0:Math.sin(time*(walking?8:2))*.08-vx*.00009);sprite(c,'tail',52,0,190);c.restore();
    c.save();c.translate(0,bob);c.rotate(reduced?0:walking?Math.sin(time*12)*.025:0);
    if(images.squirrel)sprite(c,victory&&images.celebration?'celebration':'squirrel',0,0,190);
    else{ellipse(c,0,-55,42,55,'#e98f35');ellipse(c,0,-128,52,51,'#f4a14b');ellipse(c,0,-133,40,33,'#fce0aa');ellipse(c,-18,-138,10,13,'#3f332a');ellipse(c,18,-138,10,13,'#3f332a');basket(c,0,-75);}
    // A very brief blink, painted inside the eye silhouettes of the plush render.
    const blink=!celebrate && time%4.7>4.57 && time%4.7<4.67;
    if(blink && !reduced && images.squirrel && !victory){c.strokeStyle='#834b2b';c.lineWidth=3.2;c.lineCap='round';for(const eye of [-22,22]){ellipse(c,eye,-139,13,17,'#f3d4ab');c.beginPath();c.arc(eye,-141,12,.15,Math.PI-.15);c.stroke();}}
    if(missAge<.8){c.fillStyle='#fff4c9';c.font='bold 20px Georgia';c.textAlign='center';c.fillText('?!',0,-199-Math.sin(missAge*Math.PI)*8);}
    c.restore();c.restore();
  }
  function background(c,w,h,time,level=0,reduced=false){
    if(images.forest)cover(c,images.forest,w,h);else{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6c9f7e');g.addColorStop(1,'#264d37');c.fillStyle=g;c.fillRect(0,0,w,h);}
    const tints=['#f8dc6c00','#26c9c11b','#ee844619','#8457af1a','#ffbe5c24'];c.fillStyle=tints[level]||tints[0];c.fillRect(0,0,w,h);
    for(let i=0;i<23;i++){const t=reduced?0:time,px=(i*173.7+Math.sin(t*.4+i)*32)%w,py=(i*71.3+Math.cos(t*.3+i)*22)%(h*.85);c.save();c.globalAlpha=.3+Math.sin(t*1.8+i)*.2;c.shadowColor=i%3?'#fff19c':'#91ffff';c.shadowBlur=10;ellipse(c,px,py,i%4===0?2:1.2,i%4===0?2:1.2,i%3?'#fff3b2':'#b9ffed');c.restore();}
    if(!reduced){for(let i=0;i<4;i++){c.save();const x=(time*13+i*281)%w,y=(time*17+i*137)%(h+80)-40;c.translate(x,y);c.rotate(time*.4+i);ellipse(c,0,0,3,7,'#d8bd6877');c.restore();}}
  }
  function platform(c,w,y,menu=false){
    c.save();c.shadowColor='#183e3877';c.shadowBlur=12;c.shadowOffsetY=9;
    const g=c.createLinearGradient(0,y,0,y+27);g.addColorStop(0,'#68884d');g.addColorStop(.2,'#92a457');g.addColorStop(.3,'#775f34');g.addColorStop(1,'#3c4a2c');
    round(c,menu?w*.58:38,y,menu?w*.4:w-76,22,11,g);c.shadowBlur=0;
    c.strokeStyle='#bad37955';c.lineWidth=2;for(let i=0;i<18;i++){const x=menu?w*.6+i*w*.019:58+i*(w-110)/18;c.beginPath();c.moveTo(x,y+2);c.lineTo(x+7,y-6);c.stroke();}c.restore();
  }
  function particle(c,p){c.save();c.globalAlpha=clamp(p.life/p.max,0,1);if(p.kind==='star')star(c,p.x,p.y,p.size,p.color,p.age*2);else if(p.kind==='heart')heart(c,p.x,p.y,p.size,.8);else ellipse(c,p.x,p.y,p.size,p.size,p.color);c.restore();}
  window.NuttyArt={images,ready,nut,star,heart,basket,truck,rabbit,rabbitArms,squirrel,background,platform,particle};
})();
