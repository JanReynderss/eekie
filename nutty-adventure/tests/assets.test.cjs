const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function exists(relative){
  const parts=relative.replace(/^\.\//,'').split('/');let directory=root;
  for(const part of parts){assert.ok(fs.readdirSync(directory).includes(part),`Exact case-sensitive path exists: ${relative}`);directory=path.join(directory,part);}
  assert.ok(fs.statSync(directory).isFile());
}
test('all static page references and production art files exist with exact case',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g))exists(m[1]);
  const art=fs.readFileSync(path.join(root,'art.js'),'utf8');
  for(const m of art.matchAll(/'((?:backgrounds|characters)\/[^']+)'/g))exists(`assets/${m[1]}`);
  for(const nut of ['almond','acorn','chestnut','hazelnut','walnut'])exists(`assets/nuts/${nut}.svg`);
  for(const reward of ['golden-acorn','moonlit-mushroom','starlight-diamond','glowflower','friendship-star','mystery-box'])exists(`assets/rewards/${reward}.svg`);
  exists('.nojekyll');
});
test('game runs without external requests or a build step, including at a project subpath',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    assert.ok(m[1].startsWith('./'),m[1]);const url=new URL(m[1],'https://example.github.io/nutty-adventure/');assert.ok(url.pathname.startsWith('/nutty-adventure/'));
  }
  for(const file of ['index.html','style.css','engine.js','art.js','game.js']){
    const source=fs.readFileSync(path.join(root,file),'utf8');assert.ok(!/https?:\/\//.test(source),`No remote dependencies in ${file}`);
    assert.ok(!/\bfetch\s*\(|\bimport\s*\(|\bXMLHttpRequest\b/.test(source),`No network-only module or asset loading in ${file}`);
  }
});
